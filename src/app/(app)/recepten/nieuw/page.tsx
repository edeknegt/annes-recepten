import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RecipeForm } from '@/components/recipe-form'

export default async function NewRecipePage() {
  const supabase = await createClient()

  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('subcategories').select('*').order('sort_order'),
  ])

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 bg-honey-50/80 backdrop-blur-sm">
        <Link
          href="/recepten"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Terug naar recepten
        </Link>
        <h1 className="page-title">Nieuw recept</h1>
      </div>
      <RecipeForm
        categories={categories || []}
        subcategories={subcategories || []}
      />
    </div>
  )
}
