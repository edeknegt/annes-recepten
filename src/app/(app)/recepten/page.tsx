import { Suspense } from 'react'
import Link from 'next/link'
import { Clock, Users, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RecipeFilters } from '@/components/recipe-filters'
import { Badge } from '@/components/ui/badge'
import { formatPrepTime } from '@/lib/utils'
import type { Category, Recipe } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{
    q?: string
    categorieen?: string
    subcategorieen?: string
    tijd?: string
    ingredienten?: string
  }>
}

export default async function RecipesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch categories, subcategories, and total recipe count
  const [{ data: categories }, { data: subcategories }, { count: totalCount }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('subcategories').select('*').order('sort_order'),
    supabase.from('recipes').select('*', { count: 'exact', head: true }),
  ])

  // Build recipe query
  let query = supabase
    .from('recipes')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false })

  // Filter by search query
  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }

  // Filter by categories
  if (params.categorieen && categories) {
    const slugs = params.categorieen.split(',')
    const catIds = categories
      .filter((c: Category) => slugs.includes(c.slug))
      .map((c: Category) => c.id)
    if (catIds.length > 0) {
      query = query.in('category_id', catIds)
    }
  }

  let { data: recipes } = await query

  // Filter by prep time (multi-select, post-query for OR logic)
  if (params.tijd && recipes) {
    const ranges = params.tijd.split(',')
    recipes = recipes.filter(r => {
      if (!r.prep_time) return false
      return ranges.some(range => {
        if (range === '60+') return r.prep_time >= 60
        const [min, max] = range.split('-').map(Number)
        return r.prep_time >= min && r.prep_time <= max
      })
    })
  }

  // Filter by subcategories (post-query via junction table)
  if (params.subcategorieen && recipes && subcategories) {
    const slugs = params.subcategorieen.split(',')
    const subcatIds = subcategories
      .filter(sc => slugs.includes(sc.slug))
      .map(sc => sc.id)
    if (subcatIds.length > 0) {
      const { data: junctions } = await supabase
        .from('recipe_subcategories')
        .select('recipe_id')
        .in('subcategory_id', subcatIds)
      const recipeIds = new Set(junctions?.map(j => j.recipe_id))
      recipes = recipes.filter(r => recipeIds.has(r.id))
    }
  }

  // Filter by ingredient name
  if (params.ingredienten && recipes) {
    const terms = params.ingredienten.toLowerCase().split(',').map(t => t.trim()).filter(Boolean)
    if (terms.length > 0) {
      const recipeIds = recipes.map(r => r.id)
      const { data: ingredients } = await supabase
        .from('recipe_ingredients')
        .select('recipe_id, name')
        .in('recipe_id', recipeIds)
      if (ingredients) {
        const matchingRecipeIds = new Set(
          ingredients
            .filter(ing => terms.some(term => ing.name.toLowerCase().includes(term)))
            .map(ing => ing.recipe_id)
        )
        recipes = recipes.filter(r => matchingRecipeIds.has(r.id))
      }
    }
  }

  const hasFilters = params.q || params.categorieen || params.subcategorieen || params.tijd || params.ingredienten

  return (
    <div className="max-w-5xl mx-auto">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 bg-honey-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">
            Recepten
            {' '}<span className="text-sm font-normal text-gray-400">
              ({recipes?.length ?? 0} van {totalCount ?? 0})
            </span>
          </h1>
        </div>

        <Suspense fallback={<div>Laden...</div>}>
          <RecipeFilters categories={categories || []} subcategories={subcategories || []} />
        </Suspense>
      </div>

      {/* Recipe grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes?.map((recipe: Recipe) => (
          <Link
            key={recipe.id}
            href={`/recepten/${recipe.id}`}
            className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-honey-200 transition-all overflow-hidden"
          >
            {/* Colored top bar */}
            <div className="h-1.5 bg-honey-400 group-hover:bg-honey-500 transition-colors" />

            <div className="p-5">
              <h3 className="font-semibold text-gray-900 group-hover:text-honey-700 transition-colors mb-2 line-clamp-2">
                {recipe.title}
              </h3>

              <div className="flex items-center gap-3 text-sm text-gray-500">
                {recipe.prep_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatPrepTime(recipe.prep_time)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {recipe.servings}
                </span>
              </div>

              {recipe.category && (
                <div className="mt-3">
                  <Badge>{recipe.category.name}</Badge>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {(!recipes || recipes.length === 0) && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-honey-100 mb-4">
            <BookOpen className="h-8 w-8 text-honey-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Geen recepten gevonden</h3>
          <p className="text-gray-500 mb-4">
            {hasFilters
              ? 'Probeer een andere zoekopdracht of filter.'
              : 'Voeg je eerste recept toe om te beginnen!'}
          </p>
          {!hasFilters && (
            <Link
              href="/recepten/nieuw"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-honey-500 text-honey-950 font-medium hover:bg-honey-600 transition-colors"
            >
              Recept toevoegen
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
