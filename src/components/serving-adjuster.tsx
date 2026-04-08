'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Ingredient } from '@/lib/types'

interface ServingAdjusterProps {
  originalServings: number
  ingredients: Ingredient[]
}

const fractions = [
  { value: 0,    str: '' },
  { value: 1/4,  str: '\u00BC' },  // ¼
  { value: 1/3,  str: '\u2153' },  // ⅓
  { value: 1/2,  str: '\u00BD' },  // ½
  { value: 2/3,  str: '\u2154' },  // ⅔
  { value: 3/4,  str: '\u00BE' },  // ¾
  { value: 1,    str: '' },
]

function toFraction(n: number): string {
  if (n === 0) return '0'

  const whole = Math.floor(n)
  const frac = n - whole

  // Find closest fraction
  let best = fractions[0]
  let bestDist = Math.abs(frac - best.value)
  for (const f of fractions) {
    const dist = Math.abs(frac - f.value)
    if (dist < bestDist) {
      best = f
      bestDist = dist
    }
  }

  const roundedWhole = best.value >= 1 ? whole + 1 : whole

  if (best.str) return roundedWhole ? `${roundedWhole}${best.str}` : best.str
  return (roundedWhole || 1).toString()
}

function roundAmount(value: number): number {
  if (value < 10) return value // geen afronding, breuken
  if (value < 50) return Math.round(value)
  if (value < 150) return Math.round(value / 5) * 5
  if (value < 500) return Math.round(value / 10) * 10
  if (value < 1500) return Math.round(value / 50) * 50
  return Math.round(value / 100) * 100
}

function formatAmount(amount: number | null, ratio: number, isOriginal: boolean): string {
  if (amount === null) return ''
  if (isOriginal) {
    return toFraction(amount)
  }
  const adjusted = amount * ratio
  if (adjusted < 10) {
    return toFraction(adjusted)
  }
  return roundAmount(adjusted).toString()
}

export function ServingAdjuster({ originalServings, ingredients }: ServingAdjusterProps) {
  const [servings, setServings] = useState(originalServings)
  const ratio = servings / originalServings
  const isOriginal = servings === originalServings

  return (
    <div>
      {/* Serving control */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-medium text-gray-700">Porties:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setServings(Math.max(1, servings - 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-honey-50 hover:border-honey-400 transition-colors disabled:opacity-50"
            disabled={servings <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-semibold text-lg text-gray-900">
            {servings}
          </span>
          <button
            onClick={() => setServings(servings + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-honey-50 hover:border-honey-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {!isOriginal && (
          <button
            onClick={() => setServings(originalServings)}
            className="text-xs text-honey-700 hover:text-honey-800 underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Ingredients list */}
      <ul className="space-y-2">
        {ingredients.map((ing) => (
          <li key={ing.id} className="flex items-baseline gap-2 text-gray-700">
            <span className="font-medium text-gray-900 min-w-[3rem] text-right">
              {formatAmount(ing.amount, ratio, isOriginal)}
            </span>
            <span className="text-gray-500">{ing.unit}</span>
            <span>{ing.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
