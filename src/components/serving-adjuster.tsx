'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Ingredient } from '@/lib/types'

interface ServingAdjusterProps {
  originalServings: number
  ingredients: Ingredient[]
}

function formatAmount(amount: number | null, ratio: number): string {
  if (amount === null) return ''
  const adjusted = amount * ratio

  // Handle common fractions
  if (adjusted === 0) return '0'
  if (adjusted === 0.25) return '\u00BC'
  if (adjusted === 0.5) return '\u00BD'
  if (adjusted === 0.75) return '\u00BE'
  if (adjusted === 0.33 || adjusted === 1/3) return '\u2153'
  if (adjusted === 0.67 || adjusted === 2/3) return '\u2154'

  const whole = Math.floor(adjusted)
  const frac = adjusted - whole

  if (frac < 0.05) return whole.toString()
  if (frac > 0.95) return (whole + 1).toString()

  // Check common fractions for the remainder
  if (Math.abs(frac - 0.25) < 0.05) return whole ? `${whole}\u00BC` : '\u00BC'
  if (Math.abs(frac - 0.33) < 0.05) return whole ? `${whole}\u2153` : '\u2153'
  if (Math.abs(frac - 0.5) < 0.05) return whole ? `${whole}\u00BD` : '\u00BD'
  if (Math.abs(frac - 0.67) < 0.05) return whole ? `${whole}\u2154` : '\u2154'
  if (Math.abs(frac - 0.75) < 0.05) return whole ? `${whole}\u00BE` : '\u00BE'

  // Fall back to 1 decimal
  return adjusted % 1 === 0 ? adjusted.toString() : adjusted.toFixed(1)
}

export function ServingAdjuster({ originalServings, ingredients }: ServingAdjusterProps) {
  const [servings, setServings] = useState(originalServings)
  const ratio = servings / originalServings

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
        {servings !== originalServings && (
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
              {formatAmount(ing.amount, ratio)}
            </span>
            <span className="text-gray-500">{ing.unit}</span>
            <span>{ing.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
