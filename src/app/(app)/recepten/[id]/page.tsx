import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Pencil, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrepTimeLong } from '@/lib/utils'
import { ServingAdjuster } from '@/components/serving-adjuster'
import { AddToListButton } from '@/components/add-to-list-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteRecipeButton } from '@/components/delete-recipe-button'
import { ShareRecipeButton } from '@/components/share-recipe-button'
import { ServingsProvider } from '@/components/servings-context'
import { RecentRecipesTracker } from '@/components/recent-recipes-tracker'
import type { Ingredient, Step } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

type Subcategory = { id: string; name: string }

async function fetchSubcategories(id: string): Promise<Subcategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('recipe_subcategories')
    .select('subcategory:subcategories(id, name)')
    .eq('recipe_id', id)
  return (
    (data
      ?.map(r => r.subcategory as unknown as Subcategory)
      .filter(Boolean) as Subcategory[]) ?? []
  )
}

async function fetchIngredients(id: string): Promise<Ingredient[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('recipe_ingredients')
    .select('*')
    .eq('recipe_id', id)
    .order('sort_order')
  return (data ?? []) as Ingredient[]
}

async function fetchSteps(id: string): Promise<Step[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('recipe_steps')
    .select('*')
    .eq('recipe_id', id)
    .order('step_number')
  return (data ?? []) as Step[]
}

async function SubcategoryBadges({ id }: { id: string }) {
  const subcategories = await fetchSubcategories(id)
  return (
    <>
      {subcategories.map(sub => (
        <Badge key={sub.id} variant="warning">{sub.name}</Badge>
      ))}
    </>
  )
}

async function IngredientsCardBody({ id }: { id: string }) {
  const ingredients = await fetchIngredients(id)
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Ingredi&euml;nten</h2>
        <AddToListButton recipeId={id} ingredients={ingredients} />
      </div>
      <ServingAdjuster ingredients={ingredients} />
    </>
  )
}

function IngredientsCardFallback() {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Ingredi&euml;nten</h2>
      </div>
      <p className="text-sm text-gray-400">Laden&hellip;</p>
    </>
  )
}

async function StepsList({ id }: { id: string }) {
  const steps = await fetchSteps(id)
  return (
    <ol className="space-y-4">
      {steps.map(step => (
        <li key={step.id} className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-honey-100 text-honey-800 text-sm font-semibold">
            {step.step_number}
          </span>
          <p className="text-gray-700 pt-0.5">{step.description}</p>
        </li>
      ))}
    </ol>
  )
}

async function ShareButtonLoader({
  id,
  recipe,
}: {
  id: string
  recipe: {
    title: string
    prep_time: number | null
    servings: number
    source: string | null
    source_url: string | null
    category?: { name: string } | null
  }
}) {
  const [ingredients, steps, subcategories] = await Promise.all([
    fetchIngredients(id),
    fetchSteps(id),
    fetchSubcategories(id),
  ])
  return (
    <ShareRecipeButton
      recipe={recipe}
      ingredients={ingredients}
      steps={steps}
      subcategories={subcategories}
    />
  )
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single()

  if (!recipe) notFound()

  return (
    <ServingsProvider originalServings={recipe.servings}>
    <RecentRecipesTracker recipeId={recipe.id} />
    <div className="max-w-3xl mx-auto">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 bg-honey-100">
        {/* Back link */}
        <Link
          href="/recepten"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar recepten
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {recipe.category && <Badge>{recipe.category.name}</Badge>}
              <Suspense fallback={null}>
                <SubcategoryBadges id={id} />
              </Suspense>
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
            <Suspense
              fallback={
                <Button variant="outline" size="sm" disabled>
                  Delen
                </Button>
              }
            >
              <ShareButtonLoader id={id} recipe={recipe} />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: bereidingstijd + ingrediënten */}
        <div className="lg:col-span-2 space-y-6">
          {recipe.prep_time && (
            <Card>
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <Clock className="h-5 w-5 text-honey-600 shrink-0" />
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrepTimeLong(recipe.prep_time)}
                  </p>
                  <p className="text-xs text-honey-700 font-medium">Bereidingstijd</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="py-5">
              <Suspense fallback={<IngredientsCardFallback />}>
                <IngredientsCardBody id={id} />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Right column: bereiding */}
        <Card className="lg:col-span-3">
          <CardContent className="py-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bereiding</h2>
            <Suspense fallback={<p className="text-sm text-gray-400">Laden&hellip;</p>}>
              <StepsList id={id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Date added & source */}
      <div className="mt-6 text-sm text-gray-500">
        <span>Toegevoegd op {new Date(recipe.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
      {recipe.source && (
        <div className="mt-1 text-sm text-gray-500">
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
    </ServingsProvider>
  )
}
