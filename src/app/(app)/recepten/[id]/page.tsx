import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Pencil, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ServingAdjuster } from '@/components/serving-adjuster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteRecipeButton } from '@/components/delete-recipe-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: recipe } = await supabase
    .from('recipes')
    .select(`
      *,
      category:categories(*),
      recipe_subcategories(
        subcategory:subcategories(*)
      ),
      ingredients:recipe_ingredients(*),
      steps:recipe_steps(*)
    `)
    .eq('id', id)
    .single()

  if (!recipe) notFound()

  const subcategories = recipe.recipe_subcategories?.map(
    (rs: { subcategory: { id: string; name: string } }) => rs.subcategory
  ) || []

  const ingredients = [...(recipe.ingredients || [])].sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  )
  const steps = [...(recipe.steps || [])].sort(
    (a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number
  )

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/recepten"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar recepten
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-gray-600">{recipe.description}</p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {recipe.category && <Badge>{recipe.category.name}</Badge>}
            {subcategories.map((sub: { id: string; name: string }) => (
              <Badge key={sub.id} variant="warning">{sub.name}</Badge>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 shrink-0">
          <Link href={`/recepten/${id}/bewerken`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Bewerken
            </Button>
          </Link>
          <DeleteRecipeButton recipeId={id} />
        </div>
      </div>

      {/* Time info */}
      {totalTime > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          {recipe.prep_time && (
            <Card className="flex-1 min-w-[140px]">
              <CardContent className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-1 text-honey-700 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Voorbereiding</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{recipe.prep_time} min</p>
              </CardContent>
            </Card>
          )}
          {recipe.cook_time && (
            <Card className="flex-1 min-w-[140px]">
              <CardContent className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-1 text-honey-700 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Bereidingstijd</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{recipe.cook_time} min</p>
              </CardContent>
            </Card>
          )}
          {recipe.prep_time && recipe.cook_time && (
            <Card className="flex-1 min-w-[140px]">
              <CardContent className="py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-1 text-honey-700 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Totaal</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">{totalTime} min</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ingredients */}
        <Card className="lg:col-span-2">
          <CardContent className="py-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingredi&euml;nten</h2>
            <ServingAdjuster
              originalServings={recipe.servings}
              ingredients={ingredients}
            />
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className="lg:col-span-3">
          <CardContent className="py-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bereiding</h2>
            <ol className="space-y-4">
              {steps.map((step: { id: string; step_number: number; description: string }) => (
                <li key={step.id} className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-honey-100 text-honey-800 text-sm font-semibold">
                    {step.step_number}
                  </span>
                  <p className="text-gray-700 pt-0.5">{step.description}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Source */}
      {recipe.source && (
        <div className="mt-6 text-sm text-gray-500">
          <span>Bron: {recipe.source}</span>
          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-1 text-honey-700 hover:text-honey-800 underline"
            >
              Bekijk <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
