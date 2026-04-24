import type { SupabaseClient } from '@supabase/supabase-js'
import type { ShoppingGroup, ShoppingItem, ShopCategory, RecurringRule } from './types'

const SNAPSHOT_KEY = 'annes-keuken:shopping-snapshot'
const OUTBOX_KEY = 'annes-keuken:shopping-outbox'

// ─────────────────────────────────────────────────────────────────────────────
// Snapshot (volledige read-cache van de lijst-pagina)
// ─────────────────────────────────────────────────────────────────────────────
export interface ShoppingSnapshot {
  groups: ShoppingGroup[]
  shopCategories: ShopCategory[]
  items: ShoppingItem[]
  rules: RecurringRule[]
  savedAt: number
}

export function loadSnapshot(): ShoppingSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? (JSON.parse(raw) as ShoppingSnapshot) : null
  } catch {
    return null
  }
}

export function saveSnapshot(snap: Omit<ShoppingSnapshot, 'savedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    const full: ShoppingSnapshot = { ...snap, savedAt: Date.now() }
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(full))
  } catch {
    // Quota? Ignore.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Outbox (offline mutaties wachten op sync)
// ─────────────────────────────────────────────────────────────────────────────
export interface OutboxToggle {
  op: 'toggle'
  itemId: string
  checked_at: string | null
  ts: number
}

export type OutboxEntry = OutboxToggle

export function readOutbox(): OutboxEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    return raw ? (JSON.parse(raw) as OutboxEntry[]) : []
  } catch {
    return []
  }
}

export function writeOutbox(entries: OutboxEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    if (entries.length === 0) localStorage.removeItem(OUTBOX_KEY)
    else localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries))
  } catch {
    // Ignore
  }
}

export function enqueueOutbox(entry: OutboxEntry): void {
  const current = readOutbox()
  // Coalesce: voor toggle-op van hetzelfde item, vervang eerdere entry
  if (entry.op === 'toggle') {
    const filtered = current.filter(
      (e) => !(e.op === 'toggle' && e.itemId === entry.itemId)
    )
    writeOutbox([...filtered, entry])
    return
  }
  writeOutbox([...current, entry])
}

// ─────────────────────────────────────────────────────────────────────────────
// Drain: uitgestelde mutaties naar Supabase sturen.
// Retourneert aantal geslaagd / gefaald; gefaalde blijven in outbox.
// ─────────────────────────────────────────────────────────────────────────────
export async function drainOutbox(
  supabase: SupabaseClient
): Promise<{ succeeded: number; failed: number }> {
  const entries = readOutbox().sort((a, b) => a.ts - b.ts)
  if (entries.length === 0) return { succeeded: 0, failed: 0 }

  let succeeded = 0
  let failed = 0
  const remaining: OutboxEntry[] = []

  for (const e of entries) {
    if (e.op === 'toggle') {
      try {
        const { error } = await supabase
          .from('shopping_items')
          .update({ checked_at: e.checked_at })
          .eq('id', e.itemId)
        if (error) {
          remaining.push(e)
          failed++
        } else {
          succeeded++
        }
      } catch {
        remaining.push(e)
        failed++
      }
    }
  }

  writeOutbox(remaining)
  return { succeeded, failed }
}
