'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import {
  Plus,
  Check,
  X,
  Route,
  Trash2,
  Pencil,
  Merge,
  FolderPlus,
  Repeat,
  WifiOff,
  ArrowRightLeft,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'
import { mergeAmountTexts, shopCategoryPillClass } from '@/lib/shopping'
import { describeRule, isRuleDue } from '@/lib/recurring'
import {
  loadSnapshot,
  saveSnapshot,
  enqueueOutbox,
  drainOutbox,
  readOutbox,
} from '@/lib/shopping-offline'
import { useOnlineStatus } from '@/hooks/use-online-status'
import type {
  Product,
  RecurringRule,
  ShopCategory,
  ShoppingGroup,
  ShoppingItem,
} from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Sortable item row
// ─────────────────────────────────────────────────────────────────────────────
interface SortableItemProps {
  item: ShoppingItem
  online: boolean
  canMove: boolean
  onToggle: (item: ShoppingItem) => void
  onDelete: (itemId: string) => void
  onAmountSave: (itemId: string, newText: string | null) => void
  onNameSave: (itemId: string, newName: string) => void
  onMoveRequest: (item: ShoppingItem) => void
}

function SortableItem({
  item,
  online,
  canMove,
  onToggle,
  onDelete,
  onAmountSave,
  onNameSave,
  onMoveRequest,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto' as const,
  }

  const checked = item.checked_at !== null

  const [editingAmount, setEditingAmount] = useState(false)
  const [amountDraft, setAmountDraft] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const startEditAmount = () => {
    if (!online) return
    setAmountDraft(item.amount_text ?? '')
    setEditingAmount(true)
  }

  const commitAmount = () => {
    setEditingAmount(false)
    const next = amountDraft.trim() || null
    if (next !== (item.amount_text ?? null)) {
      onAmountSave(item.id, next)
    }
  }

  const cancelEditAmount = () => {
    setEditingAmount(false)
    setAmountDraft('')
  }

  const startEditName = () => {
    if (!online) return
    setNameDraft(item.name)
    setEditingName(true)
  }

  const commitName = () => {
    setEditingName(false)
    const next = nameDraft.trim()
    if (next && next !== item.name) {
      onNameSave(item.id, next)
    }
  }

  const cancelEditName = () => {
    setEditingName(false)
    setNameDraft('')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 pl-1 pr-1 bg-white border-t border-gray-100 first:border-t-0 touch-none cursor-grab active:cursor-grabbing',
        isDragging && 'shadow-lg ring-1 ring-honey-300'
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(item)}
        className="flex items-center justify-center p-3 shrink-0"
        aria-label={checked ? 'Deselecteer' : 'Afvinken'}
      >
        <div
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            checked ? 'bg-honey-500 border-honey-500' : 'border-gray-300'
          )}
        >
          {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>
      </button>

      {/* Hoeveelheid: pill (met tap-to-edit), of ghost-plus voor leeg veld */}
      {editingAmount ? (
        <input
          autoFocus
          value={amountDraft}
          onChange={(e) => setAmountDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter') {
              e.preventDefault()
              commitAmount()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancelEditAmount()
            }
          }}
          onBlur={commitAmount}
          placeholder="500 g"
          className="w-14 text-[11px] font-medium px-1.5 py-1 rounded border border-honey-400 bg-white outline-none focus:ring-2 focus:ring-honey-200 tabular-nums shrink-0"
        />
      ) : item.amount_text ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); startEditAmount() }}
          disabled={!online}
          className={cn(
            'text-[11px] font-medium px-1.5 py-0.5 bg-gray-100 rounded shrink-0 tabular-nums transition-colors',
            online && 'hover:bg-gray-200 cursor-text',
            checked && 'opacity-50'
          )}
          aria-label="Hoeveelheid bewerken"
        >
          {item.amount_text}
        </button>
      ) : online ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); startEditAmount() }}
          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-gray-200 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Hoeveelheid toevoegen"
          tabIndex={-1}
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
        </button>
      ) : null}

      {editingName ? (
        <input
          autoFocus
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter') {
              e.preventDefault()
              commitName()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              cancelEditName()
            }
          }}
          onBlur={commitName}
          className="flex-1 text-[15px] py-2.5 bg-transparent outline-none text-gray-900 min-w-0"
        />
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); startEditName() }}
          disabled={!online}
          className={cn(
            'flex-1 min-w-0 text-left text-[15px] truncate py-2.5 cursor-text',
            checked ? 'text-gray-400 line-through' : 'text-gray-900',
            !online && 'cursor-default'
          )}
        >
          {item.name}
        </button>
      )}
      {item.shop_category && (
        <span
          className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap',
            shopCategoryPillClass(item.shop_category.slug),
            checked && 'opacity-50'
          )}
        >
          {item.shop_category.name}
        </span>
      )}

      {canMove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMoveRequest(item) }}
          className="flex items-center justify-center p-3 text-gray-300 hover:text-honey-700 shrink-0"
          aria-label="Verplaatsen naar andere groep"
          title="Verplaatsen naar andere groep"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
      )}

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="flex items-center justify-center p-3 text-gray-300 hover:text-red-500 shrink-0"
        aria-label="Verwijderen"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function LijstPage() {
  const supabase = createClient()

  const [groups, setGroups] = useState<ShoppingGroup[]>([])
  const [shopCategories, setShopCategories] = useState<ShopCategory[]>([])
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const online = useOnlineStatus()
  const [offlineToast, setOfflineToast] = useState<string | null>(null)
  const showOfflineToast = (msg: string) => {
    setOfflineToast(msg)
    setTimeout(() => setOfflineToast(null), 2500)
  }
  const requireOnline = (msg = 'Alleen online beschikbaar'): boolean => {
    if (online) return true
    showOfflineToast(msg)
    return false
  }

  // Nieuwe-groep inline
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const newGroupInputRef = useRef<HTMLInputElement>(null)

  // Inline hernoemen
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null)
  const [renamingGroupName, setRenamingGroupName] = useState('')

  // Inline quick-add (Apple Reminders-stijl, per groep activeerbaar)
  const [quickName, setQuickName] = useState('')
  const [quickSuggestions, setQuickSuggestions] = useState<Product[]>([])
  const [quickAdding, setQuickAdding] = useState(false)
  const [quickTargetGroupId, setQuickTargetGroupId] = useState<string | null>(null)
  const quickInputRef = useRef<HTMLInputElement>(null)

  // Confirmaties
  const [cleanupOpen, setCleanupOpen] = useState(false)
  const [deleteGroupConfirm, setDeleteGroupConfirm] = useState<{
    groupId: string
    groupName: string
  } | null>(null)

  // Verplaats-sheets
  const [moveItem, setMoveItem] = useState<ShoppingItem | null>(null)
  const [mergeSource, setMergeSource] = useState<ShoppingGroup | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ---------------------------------------------------------------------------
  // Data laden
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, catsRes, itemsRes, rulesRes] = await Promise.all([
        supabase
          .from('shopping_groups')
          .select('*')
          .order('is_default', { ascending: false })
          .order('sort_order'),
        supabase.from('shop_categories').select('*').order('sort_order'),
        supabase
          .from('shopping_items')
          .select('*, shop_category:shop_categories(*)')
          .order('manual_sort_order'),
        supabase
          .from('recurring_rules')
          .select('*')
          .eq('active', true),
      ])

      const nextGroups = (groupsRes.data as ShoppingGroup[]) || []
      const nextCats = (catsRes.data as ShopCategory[]) || []
      const nextItems = (itemsRes.data as ShoppingItem[]) || []
      const nextRules = (rulesRes.data as RecurringRule[]) || []

      setGroups(nextGroups)
      setShopCategories(nextCats)
      setItems(nextItems)
      setRules(nextRules)
      setLoading(false)

      saveSnapshot({
        groups: nextGroups,
        shopCategories: nextCats,
        items: nextItems,
        rules: nextRules,
      })
    } catch {
      // Offline of netwerkfout: snapshot is al gehydrateerd, niks te doen
      setLoading(false)
    }
  }, [supabase])

  // Initiale hydratie uit snapshot (instant render), gevolgd door verse fetch
  useEffect(() => {
    const snap = loadSnapshot()
    if (snap) {
      setGroups(snap.groups)
      setShopCategories(snap.shopCategories)
      setItems(snap.items)
      setRules(snap.rules)
      setLoading(false)
    }
    setPendingCount(readOutbox().length)
    fetchData()
  }, [fetchData])

  // Bij terug online: outbox legen en opnieuw fetchen
  useEffect(() => {
    if (!online) return
    const outbox = readOutbox()
    if (outbox.length === 0) return
    ;(async () => {
      const { succeeded, failed } = await drainOutbox(supabase)
      setPendingCount(failed)
      if (succeeded > 0) {
        showOfflineToast(
          `${succeeded} offline ${succeeded === 1 ? 'wijziging' : 'wijzigingen'} gesynct`
        )
        fetchData()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

  const defaultGroup = useMemo(() => groups.find(g => g.is_default) ?? null, [groups])
  const adHocGroups = useMemo(() => groups.filter(g => !g.is_default), [groups])

  const itemsByGroup = useMemo(() => {
    const m: Record<string, ShoppingItem[]> = {}
    for (const it of items) (m[it.group_id] ||= []).push(it)
    return m
  }, [items])

  // ---------------------------------------------------------------------------
  // Typeahead: quick-add balk
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const q = quickName.trim().toLowerCase()
    if (q.length < 1) {
      setQuickSuggestions([])
      return
    }
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('*, shop_category:shop_categories(*)')
        .ilike('name_normalized', `%${q}%`)
        .order('name')
        .limit(8)
      setQuickSuggestions((data as Product[]) || [])
    }, 140)
    return () => clearTimeout(handle)
  }, [quickName, supabase])

  // ---------------------------------------------------------------------------
  // Quick-add: activeer inline invoer voor een specifieke groep
  // ---------------------------------------------------------------------------
  const activateQuickAdd = (groupId: string) => {
    if (!requireOnline('Toevoegen alleen online beschikbaar')) return
    setQuickTargetGroupId(groupId)
    setQuickName('')
    setQuickSuggestions([])
    requestAnimationFrame(() => quickInputRef.current?.focus())
  }

  const deactivateQuickAdd = () => {
    setQuickTargetGroupId(null)
    setQuickName('')
    setQuickSuggestions([])
  }

  const quickAdd = async (rawName: string, product?: Product) => {
    const name = rawName.trim()
    if (!name || !quickTargetGroupId) return
    if (!requireOnline('Toevoegen alleen online beschikbaar')) return
    setQuickAdding(true)

    let productId = product?.id ?? null
    let categoryId = product?.shop_category_id ?? null

    if (!productId) {
      const { data: existing } = await supabase
        .from('products')
        .select('id, shop_category_id')
        .eq('name_normalized', name.toLowerCase())
        .maybeSingle()
      if (existing) {
        productId = existing.id
        categoryId = existing.shop_category_id
      } else {
        const overig = shopCategories.find(c => c.slug === 'overig')
        if (overig) {
          const { data: created } = await supabase
            .from('products')
            .insert({
              name,
              name_normalized: name.toLowerCase(),
              shop_category_id: overig.id,
              is_seed: false,
            })
            .select('id')
            .single()
          productId = created?.id ?? null
          categoryId = overig.id
        }
      }
    }

    const targetItems = itemsByGroup[quickTargetGroupId] ?? []
    const maxSort = targetItems.length > 0
      ? Math.max(...targetItems.map(i => i.manual_sort_order))
      : -1

    const { data: inserted } = await supabase
      .from('shopping_items')
      .insert({
        group_id: quickTargetGroupId,
        product_id: productId,
        name,
        amount_text: null,
        shop_category_id: categoryId,
        manual_sort_order: maxSort + 1,
      })
      .select('*, shop_category:shop_categories(*)')
      .single()

    if (inserted) setItems(prev => [...prev, inserted as ShoppingItem])

    setQuickName('')
    setQuickSuggestions([])
    setQuickAdding(false)
    requestAnimationFrame(() => quickInputRef.current?.focus())
  }

  // ---------------------------------------------------------------------------
  // Item-acties
  // ---------------------------------------------------------------------------
  const toggleChecked = async (item: ShoppingItem) => {
    const nextCheckedAt = item.checked_at === null ? new Date().toISOString() : null

    // Optimistic update + snapshot bijwerken zodat refresh/offline correct is
    let nextItems: ShoppingItem[] = []
    setItems(prev => {
      nextItems = prev.map(i => (i.id === item.id ? { ...i, checked_at: nextCheckedAt } : i))
      return nextItems
    })
    saveSnapshot({ groups, shopCategories, items: nextItems, rules })

    if (!navigator.onLine) {
      enqueueOutbox({ op: 'toggle', itemId: item.id, checked_at: nextCheckedAt, ts: Date.now() })
      setPendingCount(readOutbox().length)
      return
    }

    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ checked_at: nextCheckedAt })
        .eq('id', item.id)
      if (error) {
        enqueueOutbox({ op: 'toggle', itemId: item.id, checked_at: nextCheckedAt, ts: Date.now() })
        setPendingCount(readOutbox().length)
      }
    } catch {
      enqueueOutbox({ op: 'toggle', itemId: item.id, checked_at: nextCheckedAt, ts: Date.now() })
      setPendingCount(readOutbox().length)
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!requireOnline('Verwijderen alleen online')) return
    setItems(prev => prev.filter(i => i.id !== itemId))
    await supabase.from('shopping_items').delete().eq('id', itemId)
  }

  const saveAmount = async (itemId: string, newText: string | null) => {
    if (!requireOnline('Bewerken alleen online')) return
    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, amount_text: newText } : i))
    )
    await supabase.from('shopping_items').update({ amount_text: newText }).eq('id', itemId)
  }

  const saveName = async (itemId: string, newName: string) => {
    if (!requireOnline('Bewerken alleen online')) return
    setItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, name: newName } : i))
    )
    await supabase.from('shopping_items').update({ name: newName }).eq('id', itemId)
  }

  const requestMoveItem = (item: ShoppingItem) => {
    if (!requireOnline('Verplaatsen alleen online')) return
    setMoveItem(item)
  }

  const moveItemToGroup = async (itemId: string, targetGroupId: string) => {
    const targetItems = itemsByGroup[targetGroupId] ?? []
    const maxSort = targetItems.length > 0
      ? Math.max(...targetItems.map(i => i.manual_sort_order))
      : -1
    const newSort = maxSort + 1

    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? { ...i, group_id: targetGroupId, manual_sort_order: newSort }
          : i
      )
    )
    setMoveItem(null)

    await supabase
      .from('shopping_items')
      .update({ group_id: targetGroupId, manual_sort_order: newSort })
      .eq('id', itemId)
  }

  const cleanupChecked = async () => {
    if (!requireOnline('Opschonen alleen online')) { setCleanupOpen(false); return }
    const toDelete = items.filter(i => i.checked_at !== null).map(i => i.id)
    if (toDelete.length === 0) {
      setCleanupOpen(false)
      return
    }
    setItems(prev => prev.filter(i => i.checked_at === null))
    await supabase.from('shopping_items').delete().in('id', toDelete)
    setCleanupOpen(false)
  }

  // ---------------------------------------------------------------------------
  // Volgorde binnen groep
  // ---------------------------------------------------------------------------
  const persistOrder = async (ordered: ShoppingItem[]) => {
    await Promise.all(
      ordered.map((it, i) =>
        supabase.from('shopping_items').update({ manual_sort_order: i }).eq('id', it.id)
      )
    )
  }

  const handleDragEnd = (groupId: string) => async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const groupItems = itemsByGroup[groupId] ?? []
    const oldIndex = groupItems.findIndex(i => i.id === active.id)
    const newIndex = groupItems.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(groupItems, oldIndex, newIndex).map((it, i) => ({
      ...it,
      manual_sort_order: i,
    }))
    const others = items.filter(it => it.group_id !== groupId)
    setItems([...others, ...reordered])
    persistOrder(reordered)
  }

  const sortDefaultByCategory = async () => {
    if (!defaultGroup) return
    const defItems = itemsByGroup[defaultGroup.id] ?? []
    const order: Record<string, number> = {}
    shopCategories.forEach(c => { order[c.id] = c.sort_order })
    const sorted = [...defItems].sort((a, b) => {
      const ao = order[a.shop_category_id ?? ''] ?? 999
      const bo = order[b.shop_category_id ?? ''] ?? 999
      if (ao !== bo) return ao - bo
      return a.manual_sort_order - b.manual_sort_order
    })
    const withOrder = sorted.map((it, i) => ({ ...it, manual_sort_order: i }))
    const others = items.filter(it => it.group_id !== defaultGroup.id)
    setItems([...others, ...withOrder])
    persistOrder(withOrder)
  }

  // ---------------------------------------------------------------------------
  // Groep-acties
  // ---------------------------------------------------------------------------
  const startAddGroup = () => {
    if (!requireOnline('Groep aanmaken alleen online')) return
    setNewGroupName('')
    setAddingGroup(true)
    setTimeout(() => newGroupInputRef.current?.focus(), 0)
  }

  const createGroup = async () => {
    const name = newGroupName.trim()
    if (!name) {
      setAddingGroup(false)
      return
    }
    const maxSort = adHocGroups.length > 0
      ? Math.max(...adHocGroups.map(g => g.sort_order))
      : 0
    const { data } = await supabase
      .from('shopping_groups')
      .insert({
        name,
        is_default: false,
        sort_order: maxSort + 1,
      })
      .select('*')
      .single()
    if (data) {
      const newGroup = data as ShoppingGroup
      setGroups(prev => [...prev, newGroup])
    }
    setAddingGroup(false)
    setNewGroupName('')
  }

  const startRenameGroup = (group: ShoppingGroup) => {
    setRenamingGroupId(group.id)
    setRenamingGroupName(group.name)
  }

  const saveRenameGroup = async (groupId: string) => {
    const name = renamingGroupName.trim()
    if (!name) {
      setRenamingGroupId(null)
      return
    }
    const existing = groups.find(g => g.id === groupId)
    if (existing && existing.name === name) {
      setRenamingGroupId(null)
      return
    }
    await supabase.from('shopping_groups').update({ name }).eq('id', groupId)
    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, name } : g)))
    setRenamingGroupId(null)
  }

  const deleteGroup = async (groupId: string) => {
    // items cascade via FK
    await supabase.from('shopping_groups').delete().eq('id', groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
    setItems(prev => prev.filter(it => it.group_id !== groupId))
    setDeleteGroupConfirm(null)
  }

  const mergeGroup = async (sourceId: string, targetId: string) => {
    const srcItems = itemsByGroup[sourceId] ?? []
    const tgtItems = itemsByGroup[targetId] ?? []

    const openByName = new Map<string, { id: string; amount_text: string | null }>()
    for (const it of tgtItems) {
      if (it.checked_at === null) {
        openByName.set(it.name.trim().toLowerCase(), { id: it.id, amount_text: it.amount_text })
      }
    }

    let nextSort = tgtItems.length > 0
      ? Math.max(...tgtItems.map(i => i.manual_sort_order)) + 1
      : 0

    for (const it of srcItems) {
      const nameKey = it.name.trim().toLowerCase()
      const match = openByName.get(nameKey)
      if (match && it.checked_at === null) {
        const newText = mergeAmountTexts(match.amount_text, it.amount_text)
        await supabase
          .from('shopping_items')
          .update({ amount_text: newText })
          .eq('id', match.id)
        await supabase.from('shopping_items').delete().eq('id', it.id)
        match.amount_text = newText
      } else {
        await supabase
          .from('shopping_items')
          .update({
            group_id: targetId,
            manual_sort_order: nextSort++,
          })
          .eq('id', it.id)
      }
    }

    await supabase.from('shopping_groups').delete().eq('id', sourceId)
    setMergeSource(null)
    fetchData()
  }

  // ---------------------------------------------------------------------------
  // Herhaalregel-suggesties
  // ---------------------------------------------------------------------------
  const dueRules = useMemo(() => rules.filter(r => isRuleDue(r)), [rules])

  const acceptSuggestion = async (rule: RecurringRule) => {
    if (!defaultGroup) return
    // Ruim de regel uit de lokale lijst weg zodat de suggestie direct verdwijnt
    setRules(prev => prev.map(r => (r.id === rule.id ? { ...r, last_triggered_at: new Date().toISOString() } : r)))

    // Zoek product voor schap-categorie
    let productId = rule.product_id
    let shopCategoryId: string | null = null
    if (productId) {
      const { data: prod } = await supabase
        .from('products')
        .select('shop_category_id')
        .eq('id', productId)
        .maybeSingle()
      shopCategoryId = prod?.shop_category_id ?? null
    } else {
      const { data: prod } = await supabase
        .from('products')
        .select('id, shop_category_id')
        .eq('name_normalized', rule.name.toLowerCase())
        .maybeSingle()
      if (prod) {
        productId = prod.id
        shopCategoryId = prod.shop_category_id
      } else {
        const overig = shopCategories.find(c => c.slug === 'overig')
        if (overig) {
          const { data: created } = await supabase
            .from('products')
            .insert({
              name: rule.name,
              name_normalized: rule.name.toLowerCase(),
              shop_category_id: overig.id,
              is_seed: false,
            })
            .select('id')
            .single()
          productId = created?.id ?? null
          shopCategoryId = overig.id
        }
      }
    }

    const defItems = itemsByGroup[defaultGroup.id] ?? []
    const maxSort = defItems.length > 0
      ? Math.max(...defItems.map(i => i.manual_sort_order))
      : -1

    const { data: inserted } = await supabase
      .from('shopping_items')
      .insert({
        group_id: defaultGroup.id,
        product_id: productId,
        name: rule.name,
        amount_text: rule.amount_text,
        shop_category_id: shopCategoryId,
        manual_sort_order: maxSort + 1,
      })
      .select('*, shop_category:shop_categories(*)')
      .single()

    if (inserted) setItems(prev => [...prev, inserted as ShoppingItem])

    await supabase
      .from('recurring_rules')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', rule.id)
  }

  const dismissSuggestion = async (rule: RecurringRule) => {
    setRules(prev => prev.map(r => (r.id === rule.id ? { ...r, last_triggered_at: new Date().toISOString() } : r)))
    await supabase
      .from('recurring_rules')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', rule.id)
  }

  // ---------------------------------------------------------------------------
  // Afgeleide waarden
  // ---------------------------------------------------------------------------
  const defaultItems = defaultGroup ? itemsByGroup[defaultGroup.id] ?? [] : []
  const checkedCount = items.filter(i => i.checked_at !== null).length

  // ---------------------------------------------------------------------------
  // Helper: rendert de inline "Nieuw item…" rij voor een groep.
  // Ongefocused = placeholder-rij; tap activeert, suggestie-dropdown klapt uit.
  // ---------------------------------------------------------------------------
  const renderInlineAddRow = (groupId: string, hasItemsAbove: boolean) => {
    const isActive = quickTargetGroupId === groupId

    return (
      <div className={cn('relative', hasItemsAbove && 'border-t border-gray-100')}>
        {isActive ? (
          <div className="flex items-center gap-2 pl-1 pr-1">
            <span className="flex items-center justify-center p-3 shrink-0" aria-hidden>
              <Plus className="h-4 w-4 text-honey-600" strokeWidth={2.5} />
            </span>
            <input
              ref={quickInputRef}
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && quickName.trim() && !quickAdding) {
                  e.preventDefault()
                  quickAdd(quickName)
                } else if (e.key === 'Escape') {
                  deactivateQuickAdd()
                }
              }}
              placeholder="Nieuw item…"
              className="flex-1 py-2.5 bg-transparent text-[15px] placeholder:text-gray-400 outline-none min-w-0"
            />
            {quickAdding ? (
              <span
                className="h-4 w-4 border-2 border-honey-500 border-r-transparent rounded-full animate-spin shrink-0 mr-2"
                aria-hidden
              />
            ) : (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={deactivateQuickAdd}
                className="p-2 shrink-0 text-gray-400 hover:text-gray-600"
                aria-label="Sluiten"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => activateQuickAdd(groupId)}
            disabled={!online}
            className="w-full flex items-center gap-2 pl-1 pr-3 py-2.5 text-left hover:bg-honey-50/50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <span className="flex items-center justify-center p-3 shrink-0" aria-hidden>
              <Plus className="h-4 w-4 text-gray-300" strokeWidth={2.5} />
            </span>
            <span className="flex-1 text-[15px] text-gray-400">Nieuw item…</span>
          </button>
        )}

        {isActive && quickName.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-xl border border-gray-200 shadow-lg divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {quickSuggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => quickAdd(s.name, s)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-honey-50 text-left touch-manipulation"
              >
                <span className="flex-1 text-sm text-gray-900 truncate">{s.name}</span>
                {s.shop_category && (
                  <span
                    className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap',
                      shopCategoryPillClass(s.shop_category.slug)
                    )}
                  >
                    {s.shop_category.name}
                  </span>
                )}
              </button>
            ))}
            {!quickSuggestions.some(
              (s) => s.name.toLowerCase() === quickName.trim().toLowerCase()
            ) && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => quickAdd(quickName)}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-honey-50 text-left touch-manipulation"
              >
                <Plus className="h-4 w-4 text-honey-600 shrink-0" />
                <span className="flex-1 text-sm text-gray-900 truncate">
                  <span className="font-medium">&ldquo;{quickName.trim()}&rdquo;</span>{' '}
                  als nieuw product
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-honey-100">
        <div className="loading-avatar w-20 h-20 rounded-2xl border-2 border-honey-300 shadow-sm">
          <img
            src="/erik-anne-drinks.png"
            alt=""
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
        <p className="mt-4 text-sm text-gray-400 font-medium">Laden...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 bg-honey-100">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="page-title truncate">Boodschappen</h1>
            {!online && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800 text-white text-[10px] font-medium whitespace-nowrap"
                title={pendingCount > 0 ? `${pendingCount} wijziging(en) wachten op sync` : 'Geen bereik'}
              >
                <WifiOff className="h-3 w-3" />
                Offline{pendingCount > 0 ? ` (${pendingCount})` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={sortDefaultByCategory}
              disabled={defaultItems.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-honey-800 bg-white/70 hover:bg-white disabled:opacity-40 disabled:pointer-events-none border border-honey-300/60"
              title="Sorteer op loopvolgorde in de winkel"
            >
              <Route className="h-4 w-4" />
              <span className="hidden sm:inline">Loopvolgorde</span>
            </button>
            <button
              type="button"
              onClick={() => setCleanupOpen(true)}
              disabled={checkedCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-gray-700 bg-white/70 hover:bg-white disabled:opacity-40 disabled:pointer-events-none border border-gray-200"
              title="Afgevinkte items verwijderen"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                Opschonen{checkedCount > 0 ? ` (${checkedCount})` : ''}
              </span>
              <span className="sm:hidden">{checkedCount > 0 ? checkedCount : ''}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Suggesties (herhaalregels die nu due zijn) */}
      {dueRules.length > 0 && (
        <section className="mt-2 mb-4">
          <h2 className="px-1 mb-2 text-xs uppercase tracking-wider text-gray-500 font-semibold">
            Suggesties
          </h2>
          <div className="bg-honey-50 rounded-2xl border border-honey-200 overflow-hidden">
            {dueRules.map((rule, i) => (
              <div
                key={rule.id}
                className={cn(
                  'flex items-center gap-2 px-3',
                  i > 0 && 'border-t border-honey-200'
                )}
              >
                <Repeat className="h-4 w-4 text-honey-600 shrink-0" />
                <div className="flex-1 min-w-0 py-2.5">
                  <div className="flex items-baseline gap-2">
                    {rule.amount_text && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 bg-white rounded shrink-0 tabular-nums">
                        {rule.amount_text}
                      </span>
                    )}
                    <span className="text-[15px] text-gray-900 truncate">{rule.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{describeRule(rule)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => acceptSuggestion(rule)}
                  className="flex items-center justify-center p-2.5 rounded-full bg-honey-500 text-honey-950 hover:bg-honey-600 shrink-0 touch-manipulation"
                  title={`Toevoegen aan ${defaultGroup?.name ?? 'lijst'}`}
                  aria-label={`Toevoegen aan ${defaultGroup?.name ?? 'lijst'}`}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => dismissSuggestion(rule)}
                  className="flex items-center justify-center p-2.5 text-gray-400 hover:text-gray-600 shrink-0 touch-manipulation"
                  title="Overslaan tot volgende keer"
                  aria-label="Overslaan"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Groepen — allemaal gelijkwaardig, behalve dat de default-groep
          niet verwijderd of samengevoegd kan worden */}
      <section className="mt-2 space-y-3">
        {groups.map(group => {
          const groupItems = itemsByGroup[group.id] ?? []
          const isRenaming = renamingGroupId === group.id
          const isDefault = group.is_default

          return (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-gray-200"
            >
              <div className="flex items-center border-b border-gray-100">
                <div className="flex-1 flex items-center gap-2 pl-4 py-2.5 min-w-0">
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renamingGroupName}
                      onChange={e => setRenamingGroupName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveRenameGroup(group.id)
                        if (e.key === 'Escape') setRenamingGroupId(null)
                      }}
                      onBlur={() => saveRenameGroup(group.id)}
                      className="flex-1 bg-transparent text-[15px] text-gray-900 outline-none"
                    />
                  ) : (
                    <span className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-[15px] text-gray-900 font-medium truncate">
                        {group.name}
                      </span>
                      <span className="text-[12px] text-gray-400 shrink-0 tabular-nums">
                        ({groupItems.length})
                      </span>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => startRenameGroup(group)}
                  className="flex items-center justify-center p-3 text-gray-400 hover:text-gray-700"
                  title="Hernoemen"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {!isDefault && (
                  <button
                    type="button"
                    onClick={() => setMergeSource(group)}
                    disabled={groups.length < 2 || groupItems.length === 0}
                    className="flex items-center justify-center p-3 text-gray-400 hover:text-honey-700 disabled:opacity-30 disabled:pointer-events-none"
                    title="Samenvoegen met andere groep"
                  >
                    <Merge className="h-4 w-4" />
                  </button>
                )}
                {!isDefault && (
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteGroupConfirm({
                        groupId: group.id,
                        groupName: group.name,
                      })
                    }
                    className="flex items-center justify-center p-3 mr-1 text-gray-400 hover:text-red-500"
                    title="Verwijderen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {isDefault && <div className="mr-1" />}
              </div>

              <div>
                {groupItems.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd(group.id)}
                  >
                    <SortableContext
                      items={groupItems.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {groupItems.map(item => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          online={online}
                          onToggle={toggleChecked}
                          onDelete={deleteItem}
                          onAmountSave={saveAmount}
                          onNameSave={saveName}
                          canMove={groups.length > 1}
                          onMoveRequest={requestMoveItem}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
                {renderInlineAddRow(group.id, groupItems.length > 0)}
              </div>
            </div>
          )
        })}

        {/* Nieuwe groep — draft-card met naam-input */}
        {addingGroup && (
          <div className="bg-white rounded-2xl border border-honey-300">
            <div className="flex items-center border-b border-gray-100">
              <div className="flex-1 flex items-center gap-2 pl-4 py-2.5 min-w-0">
                <input
                  ref={newGroupInputRef}
                  autoFocus
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') createGroup()
                    if (e.key === 'Escape') {
                      setAddingGroup(false)
                      setNewGroupName('')
                    }
                  }}
                  onBlur={createGroup}
                  placeholder="Naam van de groep"
                  className="flex-1 bg-transparent text-[15px] text-gray-900 font-medium placeholder-gray-400 outline-none"
                />
              </div>
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => {
                  setAddingGroup(false)
                  setNewGroupName('')
                }}
                className="flex items-center justify-center p-3 mr-1 text-gray-400 hover:text-gray-700"
                title="Annuleren"
                aria-label="Annuleren"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 pl-1 pr-3 py-2.5">
              <span className="flex items-center justify-center p-3 shrink-0" aria-hidden>
                <Plus className="h-4 w-4 text-gray-200" strokeWidth={2.5} />
              </span>
              <span className="flex-1 text-[15px] text-gray-300 italic">
                Typ eerst een naam…
              </span>
            </div>
          </div>
        )}
      </section>

      {/* FAB — nieuwe groep */}
      {!addingGroup && (
        <button
          type="button"
          onClick={startAddGroup}
          className="fixed z-30 right-4 lg:right-8 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-8 flex items-center justify-center w-14 h-14 rounded-full bg-honey-500 text-honey-950 shadow-lg shadow-honey-900/30 hover:bg-honey-600 active:scale-95 transition-all touch-manipulation"
          aria-label="Nieuwe groep"
          title="Nieuwe groep"
        >
          <FolderPlus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      {/* Opschoon-bevestiging */}
      <Modal
        open={cleanupOpen}
        onClose={() => setCleanupOpen(false)}
        title="Afgevinkte items verwijderen"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {checkedCount === 1
              ? '1 afgevinkt item wordt verwijderd.'
              : `${checkedCount} afgevinkte items worden verwijderd (alle groepen).`}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCleanupOpen(false)}>
              Annuleren
            </Button>
            <Button variant="danger" onClick={cleanupChecked}>
              Verwijderen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verplaats-sheet — kies doelgroep voor een item */}
      <BottomSheet
        open={moveItem !== null}
        onClose={() => setMoveItem(null)}
        title={moveItem ? `'${moveItem.name}' verplaatsen` : ''}
      >
        {moveItem && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Kies waar het naartoe moet:
            </p>
            <div className="flex flex-col gap-1.5">
              {groups
                .filter(g => g.id !== moveItem.group_id)
                .map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => moveItemToGroup(moveItem.id, g.id)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-honey-50 text-left touch-manipulation transition-colors"
                  >
                    <span className="text-[15px] text-gray-900 font-medium">
                      {g.name}
                    </span>
                    <span className="text-[11px] text-gray-400 tabular-nums">
                      ({itemsByGroup[g.id]?.length ?? 0})
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Offline / sync toast */}
      {offlineToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white text-sm px-4 py-2 rounded-full shadow-lg pointer-events-none"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {offlineToast}
        </div>
      )}

      {/* Groep verwijderen — bevestiging */}
      <Modal
        open={deleteGroupConfirm !== null}
        onClose={() => setDeleteGroupConfirm(null)}
        title="Groep verwijderen"
      >
        {deleteGroupConfirm && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{deleteGroupConfirm.groupName}</span> en alle items erin worden verwijderd.
              {(itemsByGroup[deleteGroupConfirm.groupId]?.length ?? 0) > 0 &&
                ` Dit zijn ${itemsByGroup[deleteGroupConfirm.groupId].length} items.`}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteGroupConfirm(null)}>
                Annuleren
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteGroup(deleteGroupConfirm.groupId)}
              >
                Verwijderen
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Groep samenvoegen — doelgroep-picker */}
      <BottomSheet
        open={mergeSource !== null}
        onClose={() => setMergeSource(null)}
        title={mergeSource ? `'${mergeSource.name}' samenvoegen met…` : ''}
      >
        {mergeSource && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Kies de groep waar de items naartoe gaan. Zelfde producten worden opgeteld, {mergeSource.name} wordt daarna verwijderd.
            </p>
            <div className="flex flex-col gap-1.5">
              {groups
                .filter(g => g.id !== mergeSource.id)
                .map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => mergeGroup(mergeSource.id, g.id)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-honey-50 text-left touch-manipulation transition-colors"
                  >
                    <span className="text-[15px] text-gray-900 font-medium">
                      {g.name}
                    </span>
                    <span className="text-[11px] text-gray-400 tabular-nums">
                      ({itemsByGroup[g.id]?.length ?? 0})
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
