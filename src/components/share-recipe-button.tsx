'use client'

import { useState } from 'react'
import { Share, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServings } from '@/components/servings-context'

// Eenvoudige in-memory cache voor het logo, om hetzelfde bestand niet
// opnieuw te hoeven fetchen bij elke share-klik in dezelfde sessie.
let cachedLogoDataUrl: string | null = null

async function getLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl
  try {
    const res = await fetch('/erik-anne-drinks.png')
    if (!res.ok) return null
    const blob = await res.blob()
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    cachedLogoDataUrl = dataUrl
    return dataUrl
  } catch {
    return null
  }
}

const CLOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>`
const USER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`

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

function roundAmount(value: number): number {
  if (value < 10) return Math.round(value * 4) / 4
  if (value < 50) return Math.round(value)
  if (value < 150) return Math.round(value / 5) * 5
  if (value < 500) return Math.round(value / 10) * 10
  return Math.round(value / 50) * 50
}

function formatShareAmount(amount: number | null, ratio: number): string {
  if (amount === null) return ''
  const adjusted = amount * ratio
  return String(roundAmount(adjusted))
}

function generateHtml(
  { recipe, ingredients, steps }: ShareRecipeProps,
  servings: number,
  ratio: number,
  logoDataUrl: string | null
): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${recipe.title} — Recepten van Anne</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap');
  html { box-sizing: border-box; }
  *, *:before, *:after { box-sizing: inherit; }
  body { font-family: 'Raleway', -apple-system, system-ui, sans-serif; background: #FFFBE6; color: #1a1a1a; padding: 24px 16px; max-width: 640px; margin: 0 auto; line-height: 1.5; }
  .title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
  .title-row h1 { flex: 1; }
  .logo { flex-shrink: 0; width: 44px; height: 44px; border-radius: 10px; border: 2px solid #FFEC99; object-fit: cover; }
  h1 { font-size: 1.75rem; font-weight: 700; line-height: 1.2; margin: 0; }
  .meta { display: flex; gap: 16px; color: #6b7280; font-size: 0.875rem; margin-bottom: 20px; }
  .meta span { display: inline-flex; align-items: center; gap: 6px; }
  .meta svg { color: #9ca3af; }
  .card { background: #fff; border-radius: 12px; border: 1px solid #f3f4f6; padding: 20px; margin-bottom: 16px; }
  h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 12px; }
  .ingredients { display: grid; grid-template-columns: 5ch auto 1fr; gap: 6px 8px; font-size: 0.9375rem; list-style: none; padding: 0; margin: 0; }
  .ingredients li { display: contents; }
  .amount { font-weight: 600; text-align: right; }
  .unit { color: #6b7280; }
  .name { hyphens: auto; }
  .step { display: flex; gap: 12px; margin-bottom: 16px; }
  .step:last-child { margin-bottom: 0; }
  .step-num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: #FFFBE6; color: #997A10; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: center; }
  .step p { color: #374151; padding-top: 3px; font-size: 0.9375rem; margin: 0; }
  .source { margin-top: 20px; font-size: 0.8125rem; color: #9ca3af; }
  .source a { color: #BF9A14; }
  .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #FFF4BF; text-align: center; font-size: 0.75rem; color: #9ca3af; }
</style>
</head>
<body>
<div class="title-row">
  <h1>${recipe.title}</h1>
  ${logoDataUrl ? `<img src="${logoDataUrl}" alt="" class="logo">` : ''}
</div>
<div class="meta">
  ${recipe.prep_time ? `<span>${CLOCK_SVG}${formatPrepTime(recipe.prep_time)}</span>` : ''}
  <span>${USER_SVG}${servings} ${servings === 1 ? 'persoon' : 'personen'}</span>
</div>

<div class="card">
  <h2>Ingrediënten</h2>
  <ul class="ingredients">
    ${ingredients.map(i => `<li><span class="amount">${formatShareAmount(i.amount, ratio)}</span><span class="unit">${i.unit ?? ''}</span><span class="name">${i.name}</span></li>`).join('\n    ')}
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

function generateShareMessage({ recipe }: ShareRecipeProps, servings: number): string {
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

  let msg = `Hoi! Hierbij mijn recept voor ${recipe.title}. Het is een recept voor ${servings} ${servings === 1 ? 'persoon' : 'personen'}`
  if (time) msg += ` en je doet er ${time} over om het te bereiden`
  msg += `. Groetjes, Anne`
  return msg
}

export function ShareRecipeButton(props: ShareRecipeProps) {
  const [copied, setCopied] = useState(false)
  const { servings, originalServings } = useServings()
  const ratio = servings / originalServings

  const handleShare = async () => {
    const logoDataUrl = await getLogoDataUrl()
    const html = generateHtml(props, servings, ratio, logoDataUrl)
    const blob = new Blob([html], { type: 'text/html' })
    const fileName = `${props.recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`
    const file = new File([blob], fileName, { type: 'text/html' })

    // 1. Try native Share API with HTML file
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: props.recipe.title, text: generateShareMessage(props, servings), files: [file] })
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
          text: generateShareMessage(props, servings),
        })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }

    // 3. Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(generateShareMessage(props, servings))
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
