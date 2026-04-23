import { Suspense } from 'react'
import Link from 'next/link'
import { BookOpen, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  getCategories,
  getSubcategories,
  getRecipeCards,
  type RecipeCard,
} from '@/lib/cached-queries'
import { RecipeFilters } from '@/components/recipe-filters'
import { RecipeGrid } from '@/components/recipe-grid'

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

  const [categories, subcategories, allRecipes] = await Promise.all([
    getCategories(),
    getSubcategories(),
    getRecipeCards(),
  ])

  const totalCount = allRecipes.length
  let recipes: RecipeCard[] = allRecipes

  // Filter op titel
  if (params.q) {
    const q = params.q.toLowerCase()
    recipes = recipes.filter(r => r.title.toLowerCase().includes(q))
  }

  // Filter op categorieën (meerdere via komma-gescheiden slugs)
  if (params.categorieen) {
    const slugs = new Set(params.categorieen.split(','))
    const catIds = new Set(
      categories.filter(c => slugs.has(c.slug)).map(c => c.id)
    )
    if (catIds.size > 0) {
      recipes = recipes.filter(r => catIds.has(r.category_id))
    }
  }

  // Filter op subcategorieën (recipe_subcategories al in de cache)
  if (params.subcategorieen) {
    const slugs = new Set(params.subcategorieen.split(','))
    const subcatIds = new Set(
      subcategories.filter(sc => slugs.has(sc.slug)).map(sc => sc.id)
    )
    if (subcatIds.size > 0) {
      recipes = recipes.filter(r =>
        r.subcategory_ids.some(id => subcatIds.has(id))
      )
    }
  }

  // Filter op bereidingstijd-range (OR over bereiken)
  if (params.tijd) {
    const ranges = params.tijd.split(',')
    recipes = recipes.filter(r => {
      if (!r.prep_time) return false
      return ranges.some(range => {
        if (range === '60+') return r.prep_time! >= 60
        const [min, max] = range.split('-').map(Number)
        return r.prep_time! >= min && r.prep_time! <= max
      })
    })
  }

  // Filter op ingrediënt-naam (niet gecached — losse query)
  if (params.ingredienten) {
    const terms = params.ingredienten
      .toLowerCase()
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    if (terms.length > 0) {
      const supabase = await createClient()
      const recipeIds = recipes.map(r => r.id)
      const { data: ingredients } = await supabase
        .from('recipe_ingredients')
        .select('recipe_id, name')
        .in('recipe_id', recipeIds)
      if (ingredients) {
        const matching = new Set(
          ingredients
            .filter(ing =>
              terms.some(t => ing.name.toLowerCase().includes(t))
            )
            .map(ing => ing.recipe_id)
        )
        recipes = recipes.filter(r => matching.has(r.id))
      }
    }
  }

  const hasFilters =
    params.q ||
    params.categorieen ||
    params.subcategorieen ||
    params.tijd ||
    params.ingredienten

  return (
    <div className="max-w-5xl mx-auto">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 bg-honey-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">
            Recepten
            {' '}<span className="text-sm font-normal text-gray-400">
              ({recipes.length} van {totalCount})
            </span>
          </h1>
        </div>

        <Suspense fallback={<div>Laden...</div>}>
          <RecipeFilters categories={categories} subcategories={subcategories} />
        </Suspense>
      </div>

      {recipes.length > 0 && <RecipeGrid recipes={recipes} />}

      {/* FAB (rechts-onder, op mobiel boven de nav-pill) */}
      <Link
        href="/recepten/nieuw"
        className="fixed z-30 right-4 lg:right-8 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-8 flex items-center justify-center w-14 h-14 rounded-full bg-honey-500 text-honey-950 shadow-lg shadow-honey-900/30 hover:bg-honey-600 active:scale-95 transition-all touch-manipulation"
        aria-label="Nieuw recept"
        title="Nieuw recept"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </Link>

      {recipes.length === 0 && (
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
