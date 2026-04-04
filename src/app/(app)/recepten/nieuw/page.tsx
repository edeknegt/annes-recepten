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
      <Link
        href="/recepten"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Terug naar recepten
      </Link>
      <h1 className="page-title mb-6">Nieuw Recept</h1>
      <RecipeForm
        categories={categories || []}
        subcategories={subcategories || []}
      />
    </div>
  )
}
