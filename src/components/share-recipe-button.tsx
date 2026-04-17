'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareRecipeProps {
  recipe: {
    title: string
    prep_time: number | null
    servings: number
    source: string | null
    source_url: string | null
    category?: { name: string } | null
  }
  ingredients: { amount: number | null; unit: string | null; name: string }[]
  steps: { step_number: number; description: string }[]
  subcategories: { name: string }[]
}

function formatPrepTime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h} uur${m > 0 ? ` ${m} min` : ''}`
  }
  return `${minutes} min`
}

function generateHtml({ recipe, ingredients, steps, subcategories }: ShareRecipeProps): string {
  const badges = [
    recipe.category?.name,
    ...subcategories.map(s => s.name),
  ].filter(Boolean)

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${recipe.title} — Recepten van Anne</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FFFBE6; color: #1a1a1a; padding: 24px 16px; max-width: 640px; margin: 0 auto; }
  h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 8px; }
  .meta { display: flex; gap: 16px; color: #6b7280; font-size: 0.875rem; margin-bottom: 12px; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background: #FFFBE6; color: #997A10; border: 1px solid #FFF4BF; }
  .card { background: #fff; border-radius: 12px; border: 1px solid #f3f4f6; padding: 20px; margin-bottom: 16px; }
  h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 12px; }
  .ingredients li { padding: 6px 0; border-bottom: 1px solid #f9fafb; font-size: 0.9375rem; list-style: none; }
  .ingredients li:last-child { border-bottom: none; }
  .amount { font-weight: 600; min-width: 60px; display: inline-block; }
  .unit { color: #6b7280; min-width: 50px; display: inline-block; }
  .steps { counter-reset: step; }
  .step { display: flex; gap: 12px; margin-bottom: 16px; }
  .step-num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: #FFFBE6; color: #997A10; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: center; }
  .step p { color: #374151; padding-top: 3px; font-size: 0.9375rem; line-height: 1.5; }
  .source { margin-top: 20px; font-size: 0.8125rem; color: #9ca3af; }
  .source a { color: #BF9A14; }
  .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #FFF4BF; text-align: center; font-size: 0.75rem; color: #d1d5db; }
</style>
</head>
<body>
<h1>${recipe.title}</h1>
<div class="meta">
  ${recipe.prep_time ? `<span>⏱ ${formatPrepTime(recipe.prep_time)}</span>` : ''}
  <span>👤 ${recipe.servings} ${recipe.servings === 1 ? 'persoon' : 'personen'}</span>
</div>
${badges.length > 0 ? `<div class="badges">${badges.map(b => `<span class="badge">${b}</span>`).join('')}</div>` : ''}

<div class="card">
  <h2>Ingrediënten</h2>
  <ul class="ingredients">
    ${ingredients.map(i => `<li><span class="amount">${i.amount ?? ''}</span><span class="unit">${i.unit ?? ''}</span>${i.name}</li>`).join('\n    ')}
  </ul>
</div>

<div class="card">
  <h2>Bereiding</h2>
  <div class="steps">
    ${steps.map(s => `<div class="step"><span class="step-num">${s.step_number}</span><p>${s.description}</p></div>`).join('\n    ')}
  </div>
</div>

${recipe.source ? `<div class="source">Bron: ${recipe.source_url ? `<a href="${recipe.source_url}">${recipe.source}</a>` : recipe.source}</div>` : ''}
<div class="footer">Gedeeld vanuit Recepten van Anne</div>
</body>
</html>`
}

function generateText({ recipe, ingredients, steps }: ShareRecipeProps): string {
  const lines = [`${recipe.title}\n`]
  const meta = []
  if (recipe.prep_time) meta.push(`⏱ ${formatPrepTime(recipe.prep_time)}`)
  meta.push(`👤 ${recipe.servings} ${recipe.servings === 1 ? 'persoon' : 'personen'}`)
  lines.push(meta.join(' · '))
  lines.push('\nIngrediënten:')
  for (const i of ingredients) {
    const parts = [i.amount, i.unit, i.name].filter(Boolean).join(' ')
    lines.push(`- ${parts}`)
  }
  lines.push('\nBereiding:')
  for (const s of steps) {
    lines.push(`${s.step_number}. ${s.description}`)
  }
  if (recipe.source) {
    lines.push(`\nBron: ${recipe.source}${recipe.source_url ? ` (${recipe.source_url})` : ''}`)
  }
  lines.push('\nGedeeld vanuit Recepten van Anne')
  return lines.join('\n')
}

export function ShareRecipeButton(props: ShareRecipeProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // 1. Try native Share API with text (call immediately to preserve user gesture)
    if (navigator.share) {
      try {
        await navigator.share({
          title: props.recipe.title,
          text: generateText(props),
        })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }

    // 2. Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(generateText(props))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 3. Last resort: download as HTML file
      const html = generateHtml(props)
      const blob = new Blob([html], { type: 'text/html' })
      const fileName = `${props.recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-1" />
          Gekopieerd
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-1" />
          Delen
        </>
      )}
    </Button>
  )
}
