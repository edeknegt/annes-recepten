'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import type { Category, Subcategory } from '@/lib/types'

interface RecipeFiltersProps {
  categories: Category[]
  subcategories: Subcategory[]
}

const PREP_TIME_OPTIONS = [
  { label: '< 15 min', value: '0-15' },
  { label: '15–30 min', value: '15-30' },
  { label: '30–60 min', value: '30-60' },
  { label: '> 1 uur', value: '60+' },
]

export function RecipeFilters({ categories, subcategories }: RecipeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [sheetOpen, setSheetOpen] = useState(false)

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => {
    const param = searchParams.get('categorieen')
    return param ? new Set(param.split(',')) : new Set<string>()
  })
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(() => {
    const param = searchParams.get('subcategorieen')
    return param ? new Set(param.split(',')) : new Set<string>()
  })
  const [selectedPrepTimes, setSelectedPrepTimes] = useState<Set<string>>(() => {
    const param = searchParams.get('tijd')
    return param ? new Set(param.split(',')) : new Set<string>()
  })
  const [ingredients, setIngredients] = useState<string[]>(() => {
    const param = searchParams.get('ingredienten')
    return param ? param.split(',').map(s => s.trim()).filter(Boolean) : []
  })
  const ingredientInputRef = useRef<HTMLInputElement>(null)

  const activeFilterCount = [
    selectedCategories.size > 0,
    selectedSubcategories.size > 0,
    selectedPrepTimes.size > 0,
    ingredients.length > 0,
  ].filter(Boolean).length

  const buildParams = useCallback(
    (q: string, cats: Set<string>, subcats: Set<string>, tijden: Set<string>, ings: string[]) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (cats.size > 0) params.set('categorieen', Array.from(cats).join(','))
      if (subcats.size > 0) params.set('subcategorieen', Array.from(subcats).join(','))
      if (tijden.size > 0) params.set('tijd', Array.from(tijden).join(','))
      if (ings.length > 0) params.set('ingredienten', ings.join(','))
      return params
    },
    []
  )

  // Debounced URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = buildParams(query, selectedCategories, selectedSubcategories, selectedPrepTimes, ingredients)
      router.push(`/recepten${params.toString() ? `?${params.toString()}` : ''}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, buildParams, router, selectedCategories, selectedSubcategories, selectedPrepTimes, ingredients])

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
        // Remove subcategories of this category
        const catId = categories.find(c => c.slug === slug)?.id
        if (catId) {
          const subcatsToRemove = subcategories.filter(sc => sc.category_id === catId).map(sc => sc.slug)
          setSelectedSubcategories(prevSubs => {
            const nextSubs = new Set(prevSubs)
            subcatsToRemove.forEach(s => nextSubs.delete(s))
            return nextSubs
          })
        }
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const toggleSubcategory = (slug: string) => {
    setSelectedSubcategories(prev => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  const addIngredient = () => {
    const input = ingredientInputRef.current
    if (!input) return
    const value = input.value.trim().toLowerCase()
    if (value && !ingredients.includes(value)) {
      setIngredients(prev => [...prev, value])
    }
    input.value = ''
  }

  const removeIngredient = (ing: string) => {
    setIngredients(prev => prev.filter(i => i !== ing))
  }

  const clearFilters = () => {
    setSelectedCategories(new Set())
    setSelectedSubcategories(new Set())
    setSelectedPrepTimes(new Set())
    setIngredients([])
    if (ingredientInputRef.current) ingredientInputRef.current.value = ''
  }

  return (
    <>
      <div className="flex gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek recepten..."
            aria-label="Zoek recepten"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Wis zoekopdracht"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          onClick={() => setSheetOpen(true)}
          className={cn(
            'relative flex items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors shrink-0',
            activeFilterCount > 0
              ? 'bg-honey-500 border-honey-500 text-honey-950'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-honey-50'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-honey-950 text-white text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter bottom sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
      >
        <div className="space-y-6 pb-4">
          {/* Category + subcategory filter (nested) */}
          <FilterSection title="Categorie">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={cat.name}
                  active={selectedCategories.has(cat.slug)}
                  onClick={() => toggleCategory(cat.slug)}
                />
              ))}
            </div>
            {/* Subcategories nested under selected categories */}
            {categories.filter(cat => selectedCategories.has(cat.slug)).map((cat) => {
              const catSubcategories = subcategories.filter(sc => sc.category_id === cat.id)
              if (catSubcategories.length === 0) return null
              return (
                <div key={cat.id} className="mt-3 ml-1 pl-3 border-l-2 border-honey-200">
                  <span className="text-xs text-gray-400 mb-1.5 block">{cat.name}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {catSubcategories.map((sc) => (
                      <FilterChip
                        key={sc.id}
                        label={sc.name}
                        active={selectedSubcategories.has(sc.slug)}
                        onClick={() => toggleSubcategory(sc.slug)}
                        small
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </FilterSection>

          {/* Prep time filter */}
          <FilterSection title="Bereidingstijd">
            <div className="flex flex-wrap gap-2">
              {PREP_TIME_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={selectedPrepTimes.has(opt.value)}
                  onClick={() => setSelectedPrepTimes(prev => {
                    const next = new Set(prev)
                    if (next.has(opt.value)) next.delete(opt.value)
                    else next.add(opt.value)
                    return next
                  })}
                />
              ))}
            </div>
          </FilterSection>

          {/* Ingredient filter (tags) */}
          <FilterSection title="Ingrediënten">
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  ref={ingredientInputRef}
                  type="text"
                  placeholder="Bijv. kip, rijst..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addIngredient()
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500"
                />
                <button
                  onClick={addIngredient}
                  className="px-3 py-2 rounded-lg bg-honey-500 text-honey-950 text-sm font-medium hover:bg-honey-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-honey-500 text-honey-950 text-sm font-medium"
                    >
                      {ing}
                      <button
                        onClick={() => removeIngredient(ing)}
                        className="p-0.5 rounded-full hover:bg-honey-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </FilterSection>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <div className="pt-2">
              <button
                onClick={clearFilters}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Wis filters
              </button>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      {children}
    </div>
  )
}

function FilterChip({ label, active, onClick, small }: { label: string; active: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-colors',
        small ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        active
          ? 'bg-honey-500 text-honey-950'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      {active && <Check className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      {label}
    </button>
  )
}
