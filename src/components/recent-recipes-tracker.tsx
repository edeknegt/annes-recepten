'use client'

import { useEffect } from 'react'

const RECENT_KEY = 'recent-recipes'
const RECENT_LIMIT = 4

export function RecentRecipesTracker({ recipeId }: { recipeId: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      const current: string[] = raw ? JSON.parse(raw) : []
      const next = [recipeId, ...current.filter(id => id !== recipeId)].slice(0, RECENT_LIMIT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }, [recipeId])

  return null
}
