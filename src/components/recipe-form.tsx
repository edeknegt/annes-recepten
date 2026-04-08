'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, AlertCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { RecipeImport } from '@/components/recipe-import'
import { cn } from '@/lib/utils'
import type { Category, Subcategory, Recipe, Ingredient, Step } from '@/lib/types'
import type { ImportedRecipe } from '@/app/(app)/recepten/nieuw/actions'

interface IngredientRow {
  id?: string
  amount: string
  unit: string
  name: string
}

interface StepRow {
  id?: string
  description: string
}

interface RecipeFormProps {
  categories: Category[]
  subcategories: Subcategory[]
  recipe?: Recipe & {
    ingredients?: Ingredient[]
    steps?: Step[]
    recipe_subcategories?: { subcategory_id: string }[]
  }
}

export function RecipeForm({ categories, subcategories, recipe }: RecipeFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState(recipe?.title || '')
  const [prepHours, setPrepHours] = useState(() => {
    if (!recipe?.prep_time) return ''
    const h = Math.floor(recipe.prep_time / 60)
    return h > 0 ? h.toString() : ''
  })
  const [prepMinutes, setPrepMinutes] = useState(() => {
    if (!recipe?.prep_time) return ''
    const m = recipe.prep_time % 60
    return m > 0 ? m.toString() : ''
  })
  const [servings, setServings] = useState(recipe?.servings?.toString() || '')
  const [source, setSource] = useState(recipe?.source || '')
  const [sourceUrl, setSourceUrl] = useState(recipe?.source_url || '')
  const [categoryId, setCategoryId] = useState(recipe?.category_id || '')
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>(
    recipe?.recipe_subcategories?.map(rs => rs.subcategory_id) || []
  )

  // Dynamic rows
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    recipe?.ingredients?.sort((a, b) => a.sort_order - b.sort_order).map(i => ({
      id: i.id,
      amount: i.amount?.toString() || '',
      unit: i.unit || '',
      name: i.name,
    })) || [{ amount: '', unit: '', name: '' }]
  )

  const [steps, setSteps] = useState<StepRow[]>(
    recipe?.steps?.sort((a, b) => a.step_number - b.step_number).map(s => ({
      id: s.id,
      description: s.description,
    })) || [{ description: '' }]
  )

  // Filter subcategories by selected category
  const filteredSubcategories = subcategories.filter(s => s.category_id === categoryId)

  // When category changes, clear subcategories that don't belong
  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId)
    setSelectedSubcategoryIds(prev =>
      prev.filter(id => subcategories.find(s => s.id === id)?.category_id === newCategoryId)
    )
  }

  const toggleSubcategory = (id: string) => {
    setSelectedSubcategoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Ingredient helpers
  const addIngredient = () => setIngredients([...ingredients, { amount: '', unit: '', name: '' }])
  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }
  const updateIngredient = (index: number, field: keyof IngredientRow, value: string) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  // Step helpers
  const addStep = () => setSteps([...steps, { description: '' }])
  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }
  const updateStep = (index: number, value: string) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], description: value }
    setSteps(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Vul een titel in')
      return
    }
    if (!categoryId) {
      setError('Kies een categorie')
      return
    }
    if (!prepHours && !prepMinutes) {
      setError('Vul een bereidingstijd in')
      return
    }

    const validIngredients = ingredients.filter(i => i.name.trim())
    const validSteps = steps.filter(s => s.description.trim())

    if (validIngredients.length === 0) {
      setError('Voeg minimaal één ingrediënt toe')
      return
    }
    if (validSteps.length === 0) {
      setError('Voeg minimaal één bereidingsstap toe')
      return
    }

    startTransition(async () => {
      const supabase = createClient()

      const recipeData = {
        title: title.trim(),
        prep_time: (prepHours || prepMinutes) ? (parseInt(prepHours || '0') * 60) + parseInt(prepMinutes || '0') : null,
        servings: parseInt(servings) || 1,
        source: source.trim() || null,
        source_url: sourceUrl.trim() || null,
        category_id: categoryId,
      }

      let recipeId = recipe?.id

      if (recipe) {
        // Update existing recipe
        const { error: updateError } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', recipe.id)
        if (updateError) {
          setError('Fout bij opslaan: ' + updateError.message)
          return
        }

        // Delete old ingredients, steps, and subcategory links
        await Promise.all([
          supabase.from('recipe_ingredients').delete().eq('recipe_id', recipe.id),
          supabase.from('recipe_steps').delete().eq('recipe_id', recipe.id),
          supabase.from('recipe_subcategories').delete().eq('recipe_id', recipe.id),
        ])
      } else {
        // Create new recipe
        const { data, error: insertError } = await supabase
          .from('recipes')
          .insert(recipeData)
          .select('id')
          .single()
        if (insertError || !data) {
          setError('Fout bij opslaan: ' + (insertError?.message || 'Onbekende fout'))
          return
        }
        recipeId = data.id
      }

      // Insert ingredients, steps, and subcategory links
      await Promise.all([
        supabase.from('recipe_ingredients').insert(
          validIngredients.map((ing, index) => ({
            recipe_id: recipeId,
            amount: ing.amount ? parseFloat(ing.amount) : null,
            unit: ing.unit.trim() || null,
            name: ing.name.trim(),
            sort_order: index,
          }))
        ),
        supabase.from('recipe_steps').insert(
          validSteps.map((step, index) => ({
            recipe_id: recipeId,
            step_number: index + 1,
            description: step.description.trim(),
          }))
        ),
        selectedSubcategoryIds.length > 0
          ? supabase.from('recipe_subcategories').insert(
              selectedSubcategoryIds.map(subId => ({
                recipe_id: recipeId,
                subcategory_id: subId,
              }))
            )
          : Promise.resolve(),
      ])

      router.push(`/recepten/${recipeId}`)
      router.refresh()
    })
  }

  const handleImport = (data: ImportedRecipe) => {
    setTitle(data.title)
    if (data.prepTime) {
      const totalMin = parseInt(data.prepTime)
      const h = Math.floor(totalMin / 60)
      const m = totalMin % 60
      setPrepHours(h > 0 ? h.toString() : '')
      setPrepMinutes(m > 0 ? m.toString() : '')
    }
    setServings(data.servings)
    setSource(data.source)
    setSourceUrl(data.sourceUrl)
    if (data.ingredients.length > 0) {
      setIngredients(data.ingredients.map(i => ({
        amount: i.amount,
        unit: i.unit,
        name: i.name,
      })))
    }
    if (data.steps.length > 0) {
      setSteps(data.steps.map(s => ({ description: s })))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {/* Import from URL — only show for new recipes */}
      {!recipe && <RecipeImport onImport={handleImport} />}

      {/* Category & Subcategories */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
            <select
              value={categoryId}
              onChange={e => handleCategoryChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500"
            >
              <option value="">Kies een categorie...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {filteredSubcategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategorieën</label>
              <div className="flex flex-wrap gap-2">
                {filteredSubcategories.map(sub => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSubcategory(sub.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                      selectedSubcategoryIds.includes(sub.id)
                        ? 'bg-honey-500 border-honey-500 text-honey-950'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-honey-50 hover:border-honey-300'
                    )}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <Input
            label="Titel *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="bijv. Pasta Carbonara"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bereidingstijd *</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={prepHours}
                    maxLength={2}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                      setPrepHours(v)
                    }}
                    placeholder="0"
                    className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500"
                  />
                  <span className="text-sm text-gray-500">uur</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={prepMinutes}
                    maxLength={2}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                      setPrepMinutes(v)
                    }}
                    placeholder="0"
                    className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500"
                  />
                  <span className="text-sm text-gray-500">min</span>
                </div>
              </div>
            </div>
            <Input
              label="Aantal personen *"
              type="number"
              min="1"
              maxLength={2}
              value={servings}
              onChange={e => setServings(e.target.value.slice(0, 2))}
              placeholder="4"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bron"
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="bijv. Kookboek naam"
            />
            <Input
              label="Link"
              type="url"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingrediënten</h2>
          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-[4.5rem] shrink-0">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={ing.amount}
                    onChange={e => updateIngredient(index, 'amount', e.target.value)}
                    placeholder="250"
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-honey-500"
                  />
                </div>
                <div className="w-[4.5rem] shrink-0">
                  <input
                    type="text"
                    autoCapitalize="none"
                    value={ing.unit}
                    onChange={e => updateIngredient(index, 'unit', e.target.value)}
                    placeholder="gram"
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-honey-500"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    autoCapitalize="none"
                    value={ing.name}
                    onChange={e => updateIngredient(index, 'name', e.target.value)}
                    placeholder="ingrediënt..."
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-honey-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="w-8 shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={ingredients.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredient}
            className="mt-3 inline-flex items-center gap-1 text-sm text-honey-700 hover:text-honey-800 font-medium"
          >
            <Plus className="h-4 w-4" />
            Ingrediënt toevoegen
          </button>
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bereiding</h2>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-honey-100 text-honey-800 text-sm font-semibold mt-1">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <textarea
                    value={step.description}
                    onChange={e => {
                      if (e.target.value.length <= 600) updateStep(index, e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                    onFocus={e => {
                      e.target.style.height = 'auto'
                      e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                    maxLength={600}
                    placeholder="Beschrijf deze stap..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-honey-500 resize-none overflow-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="w-8 shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors mt-1"
                  disabled={steps.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addStep}
            className="mt-3 inline-flex items-center gap-1 text-sm text-honey-700 hover:text-honey-800 font-medium"
          >
            <Plus className="h-4 w-4" />
            Stap toevoegen
          </button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuleren
        </Button>
        <Button type="submit" loading={isPending}>
          {recipe ? 'Opslaan' : 'Recept toevoegen'}
        </Button>
      </div>

      {/* Error toast — fixed at bottom */}
      {error && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:max-w-sm z-50 animate-slide-up">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 text-white shadow-lg">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-0.5 rounded-full hover:bg-red-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
