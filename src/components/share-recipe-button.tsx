'use client'

import { useState } from 'react'
import { Share, Check } from 'lucide-react'
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

function generateHtml({ recipe, ingredients, steps }: ShareRecipeProps): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${recipe.title} — Recepten van Anne</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: ui-rounded, 'SF Pro Rounded', -apple-system, system-ui, sans-serif; background: #FFFBE6; color: #1a1a1a; padding: 24px 16px; max-width: 640px; margin: 0 auto; }
  h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 8px; }
  .meta { display: flex; gap: 16px; color: #6b7280; font-size: 0.875rem; margin-bottom: 20px; }
  .card { background: #fff; border-radius: 12px; border: 1px solid #f3f4f6; padding: 20px; margin-bottom: 16px; }
  h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 12px; }
  .ingredients { display: grid; grid-template-columns: auto auto 1fr; gap: 6px 8px; font-size: 0.9375rem; list-style: none; }
  .ingredients li { display: contents; }
  .amount { font-weight: 600; text-align: right; }
  .unit { color: #6b7280; }
  .name { hyphens: auto; }
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

<div class="card">
  <h2>Ingrediënten</h2>
  <ul class="ingredients">
    ${ingredients.map(i => `<li><span class="amount">${i.amount ?? ''}</span><span class="unit">${i.unit ?? ''}</span><span class="name">${i.name}</span></li>`).join('\n    ')}
  </ul>
</div>

<div class="card">
  <h2>Bereiding</h2>
  <div class="steps">
    ${steps.map(s => `<div class="step"><span class="step-num">${s.step_number}</span><p>${s.description}</p></div>`).join('\n    ')}
  </div>
</div>

${recipe.source ? `<div class="source">Bron: ${recipe.source_url ? `<a href="${recipe.source_url}">${recipe.source}</a>` : recipe.source}</div>` : ''}
<div class="footer">Gedeeld vanuit de receptenapp van Anne</div>
</body>
</html>`
}

function generateShareMessage({ recipe }: ShareRecipeProps): string {
  let time = ''
  if (recipe.prep_time) {
    if (recipe.prep_time >= 60) {
      const h = Math.floor(recipe.prep_time / 60)
      const m = recipe.prep_time % 60
      time = m > 0 ? `${h} ${h === 1 ? 'uur' : 'uren'} en ${m} minuten` : `${h} ${h === 1 ? 'uur' : 'uren'}`
    } else {
      time = `${recipe.prep_time} minuten`
    }
  }

  let msg = `Hoi! Hierbij mijn recept voor ${recipe.title}. Het is een recept voor ${recipe.servings} ${recipe.servings === 1 ? 'persoon' : 'personen'}`
  if (time) msg += ` en je doet er ${time} over om het te bereiden`
  msg += `. Groetjes, Anne`
  return msg
}

export function ShareRecipeButton(props: ShareRecipeProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const html = generateHtml(props)
    const blob = new Blob([html], { type: 'text/html' })
    const fileName = `${props.recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`
    const file = new File([blob], fileName, { type: 'text/html' })

    // 1. Try native Share API with HTML file
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: props.recipe.title, text: generateShareMessage(props), files: [file] })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }

    // 2. Try native Share API with text
    if (navigator.share) {
      try {
        await navigator.share({
          title: props.recipe.title,
          text: generateShareMessage(props),
        })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }

    // 3. Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(generateShareMessage(props))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 4. Last resort: download HTML file
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
          <Share className="h-4 w-4 mr-1" />
          Delen
        </>
      )}
    </Button>
  )
}
