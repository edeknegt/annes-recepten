'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

interface SearchBarProps {
  categories: Category[]
}

export function SearchBar({ categories }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const activeCategory = searchParams.get('categorie') || ''

  const updateParams = useCallback(
    (q: string, cat: string) => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (cat) params.set('categorie', cat)
      router.push(`/recepten${params.toString() ? `?${params.toString()}` : ''}`)
    },
    [router]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams(query, activeCategory)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, activeCategory, updateParams])

  const setCategory = (slug: string) => {
    const newCat = slug === activeCategory ? '' : slug
    updateParams(query, newCat)
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Zoek recepten..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            !activeCategory
              ? 'bg-honey-500 text-honey-950'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-honey-50'
          )}
        >
          Alles
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.slug)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeCategory === cat.slug
                ? 'bg-honey-500 text-honey-950'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-honey-50'
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
