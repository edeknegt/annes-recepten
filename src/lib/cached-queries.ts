import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Category, Subcategory } from '@/lib/types'

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
