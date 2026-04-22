'use server'

import { revalidateTag } from 'next/cache'

export async function revalidateRecipesCache() {
  revalidateTag('recipes', 'max')
}
