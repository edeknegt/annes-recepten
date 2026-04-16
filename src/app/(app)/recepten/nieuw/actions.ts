'use server'

import Anthropic from '@anthropic-ai/sdk'

export interface ImportedRecipe {
  title: string
  prepTime: string
  servings: string
  source: string
  sourceUrl: string
  ingredients: { amount: string; unit: string; name: string }[]
  steps: string[]
}

function parseDuration(iso: string): number {
  // Parse ISO 8601 duration like PT30M, PT1H30M, PT45M
  if (!iso) return 0
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  return hours * 60 + minutes
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim()
}

function parseIngredientString(text: string): { amount: string; unit: string; name: string } {
  const cleaned = stripHtml(text).trim()
  // Try to match: number(s) unit rest
  // e.g. "250 gram bloem", "2 el olie", "1/2 tl zout", "3 eieren"
  const match = cleaned.match(/^([\d.,\/\u00BD\u00BC\u00BE\u2153\u2154]+(?:\s*[-\u2013]\s*[\d.,\/\u00BD\u00BC\u00BE\u2153\u2154]+)?)\s*(gram|gr|g|kg|kilogram|ml|dl|cl|liter|l|el|eetlepel|eetlepels|tl|theelepel|theelepels|stuks?|stuk|snuf|snufje|takje|takjes|blaadjes?|plakje|plakjes|schijfje|schijfjes|teen|tenen|bosje|bosjes|blik|blikken|zakje|zakjes|potje|potjes|pakje|pakjes|kopje|kopjes|mespunt|mespuntje)?\s*(.*)/i)
  if (match) {
    return {
      amount: match[1].replace(',', '.').trim(),
      unit: (match[2] || '').trim(),
      name: match[3].trim(),
    }
  }
  // No amount found
  return { amount: '', unit: '', name: cleaned }
}

const JSON_LD_REGEX = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

function extractFromJsonLd(html: string): Partial<ImportedRecipe> | null {
  JSON_LD_REGEX.lastIndex = 0
  let match

  while ((match = JSON_LD_REGEX.exec(html)) !== null) {
    try {
      let data = JSON.parse(match[1])

      // Handle @graph arrays
      if (data['@graph']) {
        data = data['@graph'].find((item: Record<string, string>) =>
          item['@type'] === 'Recipe' ||
          (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
        )
        if (!data) continue
      }

      // Check if this is a Recipe
      const type = data['@type']
      if (type !== 'Recipe' && !(Array.isArray(type) && type.includes('Recipe'))) continue

      const result: Partial<ImportedRecipe> = {}

      if (data.name) result.title = stripHtml(data.name)
      // Use totalTime as bereidingstijd, fallback to prepTime + cookTime
      if (data.totalTime) {
        result.prepTime = parseDuration(data.totalTime).toString()
      } else {
        const prep = data.prepTime ? parseDuration(data.prepTime) : 0
        const cook = data.cookTime ? parseDuration(data.cookTime) : 0
        const total = prep + cook
        if (total > 0) result.prepTime = total.toString()
      }
      if (data.recipeYield) {
        const yield_ = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield
        const num = yield_.toString().match(/\d+/)
        if (num) result.servings = num[0]
      }

      // Parse ingredients
      if (data.recipeIngredient && Array.isArray(data.recipeIngredient)) {
        result.ingredients = data.recipeIngredient.map((ing: string) => parseIngredientString(ing))
      }

      // Parse steps
      if (data.recipeInstructions) {
        if (Array.isArray(data.recipeInstructions)) {
          result.steps = data.recipeInstructions.map((step: string | { text?: string; '@type'?: string }) => {
            if (typeof step === 'string') return stripHtml(step)
            if (step.text) return stripHtml(step.text)
            return ''
          }).filter(Boolean)
        } else if (typeof data.recipeInstructions === 'string') {
          result.steps = data.recipeInstructions
            .split(/\n/)
            .map((s: string) => stripHtml(s).trim())
            .filter(Boolean)
        }
      }

      return result
    } catch {
      continue
    }
  }

  return null
}

async function extractWithClaude(html: string, url: string): Promise<Partial<ImportedRecipe> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    const client = new Anthropic({ apiKey })

    // Trim HTML to avoid token limits — keep first ~30k chars which usually contains the recipe
    const trimmedHtml = html.slice(0, 30000)

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Extract the recipe from this webpage HTML. Return ONLY valid JSON with this exact structure, no other text:

{
  "title": "recipe title",
  "prepTime": "total time in minutes as number string, or empty",
  "servings": "number of servings as string, or empty",
  "ingredients": [
    {"amount": "number or empty", "unit": "unit or empty", "name": "ingredient name"}
  ],
  "steps": ["step 1 text", "step 2 text"]
}

For ingredients, split the amount, unit, and name into separate fields. Use metric units. If the amount is a fraction like 1/2, convert to decimal (0.5).

URL: ${url}

HTML:
${trimmedHtml}`
      }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    // Extract JSON from the response (might be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Claude extraction failed:', error)
    return null
  }
}

export async function importRecipe(url: string): Promise<{ data?: ImportedRecipe; error?: string }> {
  if (!url.trim()) {
    return { error: 'Voer een URL in' }
  }

  try {
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        return { error: 'Deze website blokkeert het ophalen van recepten. Probeer het recept handmatig in te voeren.' }
      }
      if (response.status === 404) {
        return { error: 'Pagina niet gevonden. Controleer of de link klopt.' }
      }
      return { error: `Kon de pagina niet bereiken. Controleer de link en probeer het opnieuw.` }
    }

    const html = await response.text()
    const domain = extractDomain(url)

    // Step 1: Try JSON-LD extraction
    let recipe = extractFromJsonLd(html)

    // Step 2: If incomplete, try Claude
    if (!recipe || !recipe.title || !recipe.ingredients?.length) {
      const claudeResult = await extractWithClaude(html, url)
      if (claudeResult) {
        recipe = { ...recipe, ...claudeResult }
      }
    }

    if (!recipe || !recipe.title) {
      return { error: `Kon geen recept herkennen op ${domain || 'deze pagina'}. Controleer of de link naar een specifiek recept verwijst.` }
    }

    return {
      data: {
        title: recipe.title || '',
        prepTime: recipe.prepTime || '',
        servings: recipe.servings || '',
        source: domain,
        sourceUrl: url,
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return { error: 'De website reageert te langzaam. Probeer het later opnieuw of voer het recept handmatig in.' }
    }
    if (error instanceof TypeError) {
      return { error: 'Ongeldige link. Controleer of de URL begint met https://' }
    }
    return { error: 'Er ging iets mis. Probeer het opnieuw of voer het recept handmatig in.' }
  }
}
