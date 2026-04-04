'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import type { Category, Subcategory } from '@/lib/types'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function CategoriesPage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category?: Category }>({ open: false })
  const [subcategoryModal, setSubcategoryModal] = useState<{
    open: boolean
    categoryId?: string
    subcategory?: Subcategory
  }>({ open: false })
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    type?: 'category' | 'subcategory'
    id?: string
    name?: string
  }>({ open: false })

  // Form state
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const [{ data: cats }, { data: subs }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
    ])
    setCategories(cats || [])
    setSubcategories(subs || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Category CRUD
  const openAddCategory = () => {
    setFormName('')
    setCategoryModal({ open: true })
  }
  const openEditCategory = (cat: Category) => {
    setFormName(cat.name)
    setCategoryModal({ open: true, category: cat })
  }
  const saveCategory = async () => {
    if (!formName.trim()) return
    setSaving(true)
    const slug = slugify(formName)

    if (categoryModal.category) {
      await supabase
        .from('categories')
        .update({ name: formName.trim(), slug })
        .eq('id', categoryModal.category.id)
    } else {
      const maxOrder = categories.length > 0
        ? Math.max(...categories.map(c => c.sort_order))
        : -1
      await supabase
        .from('categories')
        .insert({ name: formName.trim(), slug, sort_order: maxOrder + 1 })
    }

    setSaving(false)
    setCategoryModal({ open: false })
    fetchData()
  }

  // Subcategory CRUD
  const openAddSubcategory = (categoryId: string) => {
    setFormName('')
    setSubcategoryModal({ open: true, categoryId })
  }
  const openEditSubcategory = (sub: Subcategory) => {
    setFormName(sub.name)
    setSubcategoryModal({ open: true, categoryId: sub.category_id, subcategory: sub })
  }
  const saveSubcategory = async () => {
    if (!formName.trim()) return
    setSaving(true)
    const slug = slugify(formName)
    const categoryId = subcategoryModal.categoryId!

    if (subcategoryModal.subcategory) {
      await supabase
        .from('subcategories')
        .update({ name: formName.trim(), slug })
        .eq('id', subcategoryModal.subcategory.id)
    } else {
      const categorySubs = subcategories.filter(s => s.category_id === categoryId)
      const maxOrder = categorySubs.length > 0
        ? Math.max(...categorySubs.map(s => s.sort_order))
        : -1
      await supabase
        .from('subcategories')
        .insert({ name: formName.trim(), slug, category_id: categoryId, sort_order: maxOrder + 1 })
    }

    setSaving(false)
    setSubcategoryModal({ open: false })
    fetchData()
  }

  // Delete
  const confirmDelete = async () => {
    if (!deleteModal.id) return
    setSaving(true)
    const table = deleteModal.type === 'category' ? 'categories' : 'subcategories'
    await supabase.from(table).delete().eq('id', deleteModal.id)
    setSaving(false)
    setDeleteModal({ open: false })
    fetchData()
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="page-title mb-6">Categorie&#235;n</h1>
        <p className="text-gray-500">Laden...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Categorie&#235;n</h1>
        <Button onClick={openAddCategory} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Categorie toevoegen
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-honey-100 mb-4">
            <Tags className="h-8 w-8 text-honey-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Geen categorie&#235;n</h3>
          <p className="text-gray-500 mb-4">Voeg je eerste categorie toe om te beginnen.</p>
          <Button onClick={openAddCategory}>
            <Plus className="h-4 w-4 mr-1" />
            Categorie toevoegen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const subs = subcategories.filter(s => s.category_id === cat.id)
            return (
              <Card key={cat.id}>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <CardTitle className="text-base">{cat.name}</CardTitle>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-honey-700 hover:bg-honey-50 transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, type: 'category', id: cat.id, name: cat.name })}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  {subs.length > 0 ? (
                    <ul className="space-y-1">
                      {subs.map((sub) => (
                        <li
                          key={sub.id}
                          className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-gray-50 group"
                        >
                          <span className="text-sm text-gray-700">{sub.name}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditSubcategory(sub)}
                              className="p-1 rounded text-gray-400 hover:text-honey-700"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, type: 'subcategory', id: sub.id, name: sub.name })}
                              className="p-1 rounded text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Geen subcategorie&#235;n</p>
                  )}
                  <button
                    onClick={() => openAddSubcategory(cat.id)}
                    className="mt-2 inline-flex items-center gap-1 text-sm text-honey-700 hover:text-honey-800 font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Subcategorie toevoegen
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Category Add/Edit Modal */}
      <Modal
        open={categoryModal.open}
        onClose={() => setCategoryModal({ open: false })}
        title={categoryModal.category ? 'Categorie bewerken' : 'Nieuwe categorie'}
      >
        <div className="space-y-4">
          <Input
            label="Naam"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="bijv. Hoofdmaaltijden"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && saveCategory()}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setCategoryModal({ open: false })}>
              Annuleren
            </Button>
            <Button onClick={saveCategory} loading={saving} disabled={!formName.trim()}>
              {categoryModal.category ? 'Opslaan' : 'Toevoegen'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Subcategory Add/Edit Modal */}
      <Modal
        open={subcategoryModal.open}
        onClose={() => setSubcategoryModal({ open: false })}
        title={subcategoryModal.subcategory ? 'Subcategorie bewerken' : 'Nieuwe subcategorie'}
      >
        <div className="space-y-4">
          <Input
            label="Naam"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="bijv. Ovenschotels"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && saveSubcategory()}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSubcategoryModal({ open: false })}>
              Annuleren
            </Button>
            <Button onClick={saveSubcategory} loading={saving} disabled={!formName.trim()}>
              {subcategoryModal.subcategory ? 'Opslaan' : 'Toevoegen'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        title={`${deleteModal.type === 'category' ? 'Categorie' : 'Subcategorie'} verwijderen`}
      >
        <p className="text-gray-600 mb-6">
          Weet je zeker dat je <strong>{deleteModal.name}</strong> wilt verwijderen?
          {deleteModal.type === 'category' && ' Alle bijbehorende subcategorie\u00EBn worden ook verwijderd.'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteModal({ open: false })}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={saving}>
            Verwijderen
          </Button>
        </div>
      </Modal>
    </div>
  )
}
