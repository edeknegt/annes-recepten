import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Category, Subcategory, Recipe } from '@/lib/types'

export type RecipeCard = Pick<
  Recipe,
  'id' | 'title' | 'prep_time' | 'servings' | 'category_id' | 'created_at'
> & {
  category: { id: string; name: string; slug: string } | null
  subcategory_ids: string[]
}

// Aparte client zonder request-cookies, zodat unstable_cache geen
// user-specifieke data vasthoudt. Anon key is genoeg: RLS op categorieen
// staat public lezen toe.
function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const { data } = await anonClient()
      .from('categories')
      .select('*')
      .order('sort_order')
    return (data ?? []) as Category[]
  },
  ['categories'],
  { tags: ['categories'], revalidate: 3600 }
)

export const getSubcategories = unstable_cache(
  async (): Promise<Subcategory[]> => {
    const { data } = await anonClient()
      .from('subcategories')
      .select('*')
      .order('sort_order')
    return (data ?? []) as Subcategory[]
  },
  ['subcategories'],
  { tags: ['subcategories'], revalidate: 3600 }
)

type RawRecipeRow = {
  id: string
  title: string
  prep_time: number | null
  servings: number
  category_id: string
  created_at: string
  category: { id: string; name: string; slug: string } | null
  recipe_subcategories: { subcategory_id: string }[] | null
}

export const getRecipeCards = unstable_cache(
  async (): Promise<RecipeCard[]> => {
    const { data } = await anonClient()
      .from('recipes')
      .select(`
        id, title, prep_time, servings, category_id, created_at,
        category:categories(id, name, slug),
        recipe_subcategories(subcategory_id)
      `)
      .order('created_at', { ascending: false })
    if (!data) return []
    return (data as unknown as RawRecipeRow[]).map(r => ({
      id: r.id,
      title: r.title,
      prep_time: r.prep_time,
      servings: r.servings,
      category_id: r.category_id,
      created_at: r.created_at,
      category: r.category,
      subcategory_ids: (r.recipe_subcategories ?? []).map(rs => rs.subcategory_id),
    }))
  },
  ['recipe-cards'],
  { tags: ['recipes'], revalidate: 3600 }
)
