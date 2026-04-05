'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

interface SearchBarProps {
  categories: Category[]
}

export function SearchBar({ categories }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeCategories, setActiveCategories] = useState<Set<string>>(() => {
    const param = searchParams.get('categorieen')
    if (param) return new Set(param.split(','))
    // Default: all selected
    return new Set(categories.map(c => c.slug))
  })

  const updateParams = useCallback(
    (q: string, cats: Set<string>) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      // Only set param if not all are selected (= filtering)
      if (cats.size > 0 && cats.size < categories.length) {
        params.set('categorieen', Array.from(cats).join(','))
      }
      router.push(`/recepten${params.toString() ? `?${params.toString()}` : ''}`)
    },
    [router, categories.length]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams(query, activeCategories)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, activeCategories, updateParams])

  const toggleCategory = (slug: string) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(slug)) {
        // Don't allow deselecting all
        if (next.size > 1) next.delete(slug)
      } else {
        next.add(slug)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
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

      {/* Category filter — multi-select */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => toggleCategory(cat.slug)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0',
              activeCategories.has(cat.slug)
                ? 'bg-honey-500 text-honey-950'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-honey-50'
            )}
          >
            {activeCategories.has(cat.slug) && <Check className="h-3.5 w-3.5" />}
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
