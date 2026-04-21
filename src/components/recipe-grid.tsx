'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatPrepTime } from '@/lib/utils'
import type { Recipe } from '@/lib/types'

const RECENT_KEY = 'recent-recipes'

function readRecentIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const ids = JSON.parse(raw)
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

export function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  const [ordered, setOrdered] = useState<Recipe[]>(recipes)

  useEffect(() => {
    const recentIds = readRecentIds()
    if (recentIds.length === 0) {
      setOrdered(recipes)
      return
    }
    const index = new Map(recentIds.map((id, i) => [id, i]))
    const sorted = [...recipes].sort((a, b) => {
      const ai = index.has(a.id) ? (index.get(a.id) as number) : Infinity
      const bi = index.has(b.id) ? (index.get(b.id) as number) : Infinity
      if (ai === bi) return 0
      return ai - bi
    })
    setOrdered(sorted)
  }, [recipes])

  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ordered.map(recipe => (
        <Link
          key={recipe.id}
          href={`/recepten/${recipe.id}`}
          className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-honey-200 transition-all overflow-hidden"
        >
          <div className="h-1.5 bg-honey-400 group-hover:bg-honey-500 transition-colors" />
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 group-hover:text-honey-700 transition-colors mb-2 line-clamp-2">
              {recipe.title}
            </h3>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              {recipe.prep_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatPrepTime(recipe.prep_time)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {recipe.servings}
              </span>
            </div>

            {recipe.category && (
              <div className="mt-3">
                <Badge>{recipe.category.name}</Badge>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
