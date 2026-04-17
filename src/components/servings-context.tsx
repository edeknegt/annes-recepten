'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface ServingsContextValue {
  servings: number
  setServings: (s: number) => void
  originalServings: number
}

const ServingsContext = createContext<ServingsContextValue | null>(null)

export function ServingsProvider({ originalServings, children }: { originalServings: number; children: ReactNode }) {
  const [servings, setServings] = useState(originalServings)
  return (
    <ServingsContext.Provider value={{ servings, setServings, originalServings }}>
      {children}
    </ServingsContext.Provider>
  )
}

export function useServings() {
  const ctx = useContext(ServingsContext)
  if (!ctx) throw new Error('useServings must be used within ServingsProvider')
  return ctx
}
