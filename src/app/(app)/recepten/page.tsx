import { Suspense } from 'react'
import Link from 'next/link'
import { Clock, Users, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/search-bar'
import { Badge } from '@/components/ui/badge'
import type { Category, Recipe } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ q?: string; categorie?: string }>
}

export default async function RecipesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  // Build recipe query
  let query = supabase
    .from('recipes')
    .select('*, category:categories(*)')
    .order('created_at', { ascending: false })

  // Filter by search query
  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }

  // Filter by category
  if (params.categorie && categories) {
    const cat = categories.find((c: Category) => c.slug === params.categorie)
    if (cat) {
      query = query.eq('category_id', cat.id)
    }
  }

  const { data: recipes } = await query

  return (
    <div className="max-w-5xl mx-auto">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 bg-honey-50/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="page-title">Recepten</h1>
        </div>

        <Suspense fallback={<div>Laden...</div>}>
          <SearchBar categories={categories || []} />
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
                    {recipe.prep_time} min
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
            {params.q || params.categorie
              ? 'Probeer een andere zoekopdracht of filter.'
              : 'Voeg je eerste recept toe om te beginnen!'}
          </p>
          {!params.q && !params.categorie && (
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
