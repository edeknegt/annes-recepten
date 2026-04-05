export interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

export interface Subcategory {
  id: string
  name: string
  slug: string
  category_id: string
  sort_order: number
  created_at: string
  category?: Category
}

export interface Recipe {
  id: string
  title: string
  prep_time: number | null
  cook_time: number | null
  servings: number
  source: string | null
  source_url: string | null
  category_id: string
  created_at: string
  updated_at: string
  category?: Category
  subcategories?: Subcategory[]
  ingredients?: Ingredient[]
  steps?: Step[]
}

export interface Ingredient {
  id: string
  recipe_id: string
  amount: number | null
  unit: string | null
  name: string
  sort_order: number
}

export interface Step {
  id: string
  recipe_id: string
  step_number: number
  description: string
}

export interface RecipeSubcategory {
  recipe_id: string
  subcategory_id: string
}
