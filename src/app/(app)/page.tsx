'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrepTime } from '@/lib/utils'
import type { Recipe, Category } from '@/lib/types'

const RECENT_KEY = 'recent-recipes'
const RECENT_LIMIT = 6
const TOP_CATEGORIES = 4

function readRecentIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const ids = JSON.parse(raw)
    return Array.isArray(ids) ? ids.slice(0, RECENT_LIMIT) : []
  } catch {
    return []
  }
}

type TopCategory = Category & { count: number }

export default function Home() {
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])
  const [topCategories, setTopCategories] = useState<TopCategory[]>([])

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const recentIds = readRecentIds()

      const [catsRes, countsRes, recentRes, fillerRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('recipes').select('category_id'),
        recentIds.length > 0
          ? supabase
              .from('recipes')
              .select('*, category:categories(*)')
              .in('id', recentIds)
          : Promise.resolve({ data: [] as Recipe[], error: null }),
        // Laatste toegevoegde recepten, om aan te vullen tot RECENT_LIMIT
        supabase
          .from('recipes')
          .select('*, category:categories(*)')
          .order('created_at', { ascending: false })
          .limit(RECENT_LIMIT),
      ])

      const counts: Record<string, number> = {}
      for (const r of (countsRes.data ?? []) as { category_id: string }[]) {
        counts[r.category_id] = (counts[r.category_id] ?? 0) + 1
      }
      const top = ((catsRes.data ?? []) as Category[])
        .map(c => ({ ...c, count: counts[c.id] ?? 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_CATEGORIES)
      setTopCategories(top)

      const recentMap = new Map(
        ((recentRes.data ?? []) as Recipe[]).map(r => [r.id, r])
      )
      const ordered = recentIds
        .map(id => recentMap.get(id))
        .filter((r): r is Recipe => Boolean(r))

      if (ordered.length < RECENT_LIMIT) {
        const seen = new Set(ordered.map(r => r.id))
        for (const r of (fillerRes.data ?? []) as Recipe[]) {
          if (ordered.length >= RECENT_LIMIT) break
          if (!seen.has(r.id)) {
            ordered.push(r)
            seen.add(r.id)
          }
        }
      }

      setRecentRecipes(ordered)
    }
    load()
  }, [])

  return (
    <div className="max-w-5xl mx-auto pt-12 sm:pt-16 lg:pt-20">
      <h1 className="page-title mb-1">Hoi Anne!</h1>
      <p className="text-sm text-gray-500 mb-14">Wat ga je vandaag maken?</p>

      {recentRecipes.length > 0 && (
        <section className="mb-10">
          <h2 className="section-title mb-3">Laatst bekeken</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {recentRecipes.map(recipe => (
              <Link
                key={recipe.id}
                href={`/recepten/${recipe.id}`}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-honey-200 transition-all overflow-hidden"
              >
                <div className="h-1.5 bg-honey-400 group-hover:bg-honey-500 transition-colors" />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-honey-700 transition-colors mb-2 line-clamp-2 text-sm sm:text-base">
                    {recipe.title}
                  </h3>
                  {recipe.prep_time && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {formatPrepTime(recipe.prep_time)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title mb-3">Populaire categorieën</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {topCategories.map(cat => (
            <Link
              key={cat.id}
              href={`/recepten?categorieen=${cat.slug}`}
              className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-honey-200 transition-all overflow-hidden p-4"
            >
              <h3 className="font-semibold text-gray-900 group-hover:text-honey-700 transition-colors mb-1">
                {cat.name}
              </h3>
              <p className="text-xs text-gray-500">
                {cat.count} {cat.count === 1 ? 'recept' : 'recepten'}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
