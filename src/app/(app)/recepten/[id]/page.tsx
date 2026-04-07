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


  return (
    <div className="max-w-3xl mx-auto">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 bg-honey-50/95">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: bereidingstijd + ingrediënten */}
        <div className="lg:col-span-2 space-y-6">
          {recipe.prep_time && (() => {
            const rad = (a: number) => ((a - 90) * Math.PI) / 180

            const makeClock = (minutes: number) => {
              const fraction = Math.min(minutes / 60, 1)
              const angle = fraction * 360
              const r = 40
              const x = 50 + r * Math.cos(rad(angle))
              const y = 50 + r * Math.sin(rad(angle))
              const piePath = angle >= 360
                ? `M50,50 m0,-${r} a${r},${r} 0 1,1 0,${r * 2} a${r},${r} 0 1,1 0,-${r * 2} Z`
                : `M50,50 L50,${50 - r} A${r},${r} 0 ${angle > 180 ? 1 : 0},1 ${x},${y} Z`

              return (
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="46" fill="white" stroke="#E5E7EB" strokeWidth="2" />
                  <path d={piePath} fill="#FFD633" opacity="0.6" />
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                    <line
                      key={deg}
                      x1={50 + 38 * Math.cos(rad(deg))}
                      y1={50 + 38 * Math.sin(rad(deg))}
                      x2={50 + 43 * Math.cos(rad(deg))}
                      y2={50 + 43 * Math.sin(rad(deg))}
                      stroke="#9CA3AF"
                      strokeWidth={deg % 90 === 0 ? 2.5 : 1.5}
                      strokeLinecap="round"
                    />
                  ))}
                  <line
                    x1="50" y1="50"
                    x2={50 + 34 * Math.cos(rad(angle))}
                    y2={50 + 34 * Math.sin(rad(angle))}
                    stroke="#4D3C08"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="50" cy="50" r="3" fill="#4D3C08" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#BF9A14" strokeWidth="2.5" />
                </svg>
              )
            }

            const overHour = recipe.prep_time > 60

            return (
              <Card>
                <CardContent className="py-5 flex items-center gap-4 px-5">
                  {/* Clock(s) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-16">
                      {makeClock(overHour ? 60 : recipe.prep_time)}
                    </div>
                    {overHour && (
                      <div className="w-16 h-16">
                        {makeClock(recipe.prep_time - 60)}
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{recipe.prep_time} min</p>
                    <p className="text-sm text-honey-700 font-medium">Bereidingstijd</p>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          <Card>
            <CardContent className="py-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingredi&euml;nten</h2>
              <ServingAdjuster
                originalServings={recipe.servings}
                ingredients={ingredients}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column: bereiding */}
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
