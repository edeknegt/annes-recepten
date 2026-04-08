import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RecipeForm } from '@/components/recipe-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditRecipePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: recipe },
    { data: categories },
    { data: subcategories },
  ] = await Promise.all([
    supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(*),
        steps:recipe_steps(*),
        recipe_subcategories(subcategory_id)
      `)
      .eq('id', id)
      .single(),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('subcategories').select('*').order('sort_order'),
  ])

  if (!recipe) notFound()

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 bg-honey-100">
        <Link
          href={`/recepten/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar recept
        </Link>
        <h1 className="page-title">Recept bewerken</h1>
      </div>
      <RecipeForm
        categories={categories || []}
        subcategories={subcategories || []}
        recipe={recipe}
      />
    </div>
  )
}
