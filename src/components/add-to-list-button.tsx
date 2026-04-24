'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Check, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useServings } from '@/components/servings-context'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatAmountText, mergeAmountTexts } from '@/lib/shopping'
import type { Ingredient, ShoppingGroup } from '@/lib/types'

interface AddToListButtonProps {
  recipeId: string
  ingredients: Ingredient[]
}

export function AddToListButton({ recipeId, ingredients }: AddToListButtonProps) {
  const supabase = createClient()
  const { servings, originalServings } = useServings()
  const ratio = servings / originalServings

  const [open, setOpen] = useState(false)
  const [groups, setGroups] = useState<ShoppingGroup[]>([])
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(ingredients.map(i => i.id))
  )
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Groepen laden zodra de sheet opent
  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('shopping_groups')
        .select('*')
        .order('is_default', { ascending: false })
        .order('sort_order')
      if (cancelled) return
      const gs = (data as ShoppingGroup[]) || []
      setGroups(gs)
      setTargetGroupId(prev => prev ?? gs.find(g => g.is_default)?.id ?? gs[0]?.id ?? null)
    })()
    return () => {
      cancelled = true
    }
  }, [open, supabase])

  const openSheet = () => {
    setSelected(new Set(ingredients.map(i => i.id)))
    setOpen(true)
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === ingredients.length) setSelected(new Set())
    else setSelected(new Set(ingredients.map(i => i.id)))
  }

  const submit = async () => {
    if (selected.size === 0 || !targetGroupId) return
    setSaving(true)

    const [overigRes, existingRes] = await Promise.all([
      supabase.from('shop_categories').select('id').eq('slug', 'overig').maybeSingle(),
      supabase
        .from('shopping_items')
        .select('id, name, amount_text, manual_sort_order, checked_at')
        .eq('group_id', targetGroupId)
        .order('manual_sort_order'),
    ])

    const overigId = overigRes.data?.id ?? null
    const existing = existingRes.data ?? []

    // Alleen niet-afgevinkte items komen in aanmerking voor samenvoegen
    const openByName = new Map<string, { id: string; amount_text: string | null }>()
    for (const it of existing) {
      if (it.checked_at === null) {
        openByName.set(it.name.trim().toLowerCase(), {
          id: it.id,
          amount_text: it.amount_text,
        })
      }
    }

    let nextSort =
      existing.length > 0
        ? Math.max(...existing.map(i => i.manual_sort_order)) + 1
        : 0

    let merged = 0
    let added = 0

    for (const id of selected) {
      const ing = ingredients.find(i => i.id === id)
      if (!ing) continue

      const name = ing.name.trim()
      const nameKey = name.toLowerCase()
      const amountText = formatAmountText(ing.amount, ing.unit, ratio)

      const match = openByName.get(nameKey)
      if (match) {
        const newText = mergeAmountTexts(match.amount_text, amountText)
        await supabase
          .from('shopping_items')
          .update({ amount_text: newText })
          .eq('id', match.id)
        match.amount_text = newText
        merged++
        continue
      }

      const { data: prod } = await supabase
        .from('products')
        .select('id, shop_category_id')
        .eq('name_normalized', nameKey)
        .maybeSingle()

      let productId: string | null = prod?.id ?? null
      let shopCategoryId: string | null = prod?.shop_category_id ?? null

      if (!productId && overigId) {
        const { data: newProd } = await supabase
          .from('products')
          .insert({
            name,
            name_normalized: nameKey,
            shop_category_id: overigId,
            is_seed: false,
          })
          .select('id')
          .single()
        productId = newProd?.id ?? null
        shopCategoryId = overigId
      }

      const { data: newItem } = await supabase
        .from('shopping_items')
        .insert({
          group_id: targetGroupId,
          product_id: productId,
          name,
          amount_text: amountText,
          shop_category_id: shopCategoryId,
          manual_sort_order: nextSort++,
          source_recipe_id: recipeId,
        })
        .select('id, amount_text')
        .single()

      if (newItem) {
        openByName.set(nameKey, { id: newItem.id, amount_text: newItem.amount_text })
        added++
      }
    }

    setSaving(false)
    setOpen(false)

    const groupName = groups.find(g => g.id === targetGroupId)?.name ?? 'Lijst'
    const parts: string[] = []
    if (added > 0) parts.push(`${added} ${added === 1 ? 'item' : 'items'} toegevoegd`)
    if (merged > 0) parts.push(`${merged} samengevoegd`)
    setToast(parts.length > 0 ? `${parts.join(' · ')} → ${groupName}` : 'Klaar')
    setTimeout(() => setToast(null), 3500)
  }

  const allSelected = selected.size === ingredients.length
  const scaledDescription =
    servings === originalServings
      ? `${servings} ${servings === 1 ? 'portie' : 'porties'}`
      : `${servings} ${servings === 1 ? 'portie' : 'porties'} (origineel ${originalServings})`

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-honey-500 text-honey-950 hover:bg-honey-600 transition-colors touch-manipulation"
        title="Toevoegen aan boodschappenlijst"
        aria-label="Toevoegen aan boodschappenlijst"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        <ShoppingCart className="h-4 w-4" />
      </button>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Toevoegen aan lijst"
      >
        <div className="space-y-3">
          {/* Groep-picker (alleen bij meerdere groepen) */}
          {groups.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Naar
              </label>
              <div className="flex flex-wrap gap-1.5">
                {groups.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setTargetGroupId(g.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation',
                      targetGroupId === g.id
                        ? 'bg-honey-500 text-honey-950'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{scaledDescription}</p>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-honey-700 hover:text-honey-800 font-medium"
            >
              {allSelected ? 'Niks selecteren' : 'Alles selecteren'}
            </button>
          </div>

          <ul className="rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {ingredients.map(ing => {
              const checked = selected.has(ing.id)
              const amountText = formatAmountText(ing.amount, ing.unit, ratio)
              return (
                <li key={ing.id}>
                  <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-honey-50 touch-manipulation">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        toggleOne(ing.id)
                      }}
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                        checked ? 'bg-honey-500 border-honey-500' : 'border-gray-300'
                      )}
                    >
                      {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </button>
                    {amountText && (
                      <span className="text-[11px] font-medium px-1.5 py-0.5 bg-gray-100 rounded shrink-0 tabular-nums">
                        {amountText}
                      </span>
                    )}
                    <span
                      className={cn(
                        'flex-1 text-sm',
                        checked ? 'text-gray-900' : 'text-gray-400'
                      )}
                    >
                      {ing.name}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={submit}
              loading={saving}
              disabled={selected.size === 0 || !targetGroupId}
            >
              Toevoegen ({selected.size})
            </Button>
          </div>
        </div>
      </BottomSheet>

      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white text-sm px-4 py-2 rounded-full shadow-lg pointer-events-none"
          style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {toast}
        </div>
      )}
    </>
  )
}
