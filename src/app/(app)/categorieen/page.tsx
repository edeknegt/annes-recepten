'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
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
  const [recipeCounts, setRecipeCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Accordion state
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

  // Edit modal state
  const [editModal, setEditModal] = useState<{ open: boolean; category?: Category }>({ open: false })
  const [editName, setEditName] = useState('')
  const [editSubs, setEditSubs] = useState<{ id?: string; name: string }[]>([])

  // Add category modal
  const [addModal, setAddModal] = useState(false)
  const [addName, setAddName] = useState('')

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    type?: 'category' | 'subcategory'
    id?: string
    name?: string
  }>({ open: false })

  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const [{ data: cats }, { data: subs }, { data: recipes }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
      supabase.from('recipes').select('category_id'),
    ])
    setCategories(cats || [])
    setSubcategories(subs || [])

    const counts: Record<string, number> = {}
    if (recipes) {
      for (const r of recipes) {
        counts[r.category_id] = (counts[r.category_id] || 0) + 1
      }
    }
    setRecipeCounts(counts)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // --- Open edit modal for a category ---
  const openEditModal = (cat: Category) => {
    const subs = (subcategoriesByCategoryId[cat.id] || [])
      .map(s => ({ id: s.id, name: s.name }))
    setEditName(cat.name)
    setEditSubs(subs)
    setEditModal({ open: true, category: cat })
  }

  // --- Save everything in the edit modal ---
  const saveEditModal = async () => {
    if (!editName.trim() || !editModal.category) return
    setSaving(true)

    const cat = editModal.category
    const slug = slugify(editName)

    // Update category name
    await supabase
      .from('categories')
      .update({ name: editName.trim(), slug })
      .eq('id', cat.id)

    // Get existing subcategories for this category
    const existingSubs = subcategoriesByCategoryId[cat.id] || []
    const existingIds = existingSubs.map(s => s.id)

    // Determine which subs to update, insert, or delete
    const editSubIds = editSubs.filter(s => s.id).map(s => s.id!)
    const toDelete = existingIds.filter(id => !editSubIds.includes(id))
    const toUpdate = editSubs.filter(s => s.id && s.name.trim())
    const toInsert = editSubs.filter(s => !s.id && s.name.trim())

    const promises: PromiseLike<unknown>[] = []

    // Delete removed subcategories
    if (toDelete.length > 0) {
      promises.push(
        supabase.from('subcategories').delete().in('id', toDelete)
      )
    }

    // Update existing subcategories
    for (const sub of toUpdate) {
      promises.push(
        supabase
          .from('subcategories')
          .update({ name: sub.name.trim(), slug: slugify(sub.name) })
          .eq('id', sub.id!)
      )
    }

    // Insert new subcategories
    if (toInsert.length > 0) {
      const maxOrder = existingSubs.length > 0
        ? Math.max(...existingSubs.map(s => s.sort_order))
        : -1
      promises.push(
        supabase.from('subcategories').insert(
          toInsert.map((s, i) => ({
            name: s.name.trim(),
            slug: slugify(s.name),
            category_id: cat.id,
            sort_order: maxOrder + 1 + i,
          }))
        )
      )
    }

    await Promise.all(promises)
    setSaving(false)
    setEditModal({ open: false })
    fetchData()
  }

  // --- Subcategory helpers within edit modal ---
  const updateSubName = (index: number, name: string) => {
    const updated = [...editSubs]
    updated[index] = { ...updated[index], name }
    setEditSubs(updated)
  }

  const removeSub = (index: number) => {
    setEditSubs(editSubs.filter((_, i) => i !== index))
  }

  const addSub = () => {
    setEditSubs([...editSubs, { name: '' }])
  }

  // --- Add new category ---
  const saveNewCategory = async () => {
    if (!addName.trim()) return
    setSaving(true)
    const slug = slugify(addName)
    const maxOrder = categories.length > 0
      ? Math.max(...categories.map(c => c.sort_order))
      : -1
    await supabase
      .from('categories')
      .insert({ name: addName.trim(), slug, sort_order: maxOrder + 1 })
    setSaving(false)
    setAddModal(false)
    setAddName('')
    fetchData()
  }

  // --- Delete ---
  const confirmDelete = async () => {
    if (!deleteModal.id) return
    setSaving(true)
    const table = deleteModal.type === 'category' ? 'categories' : 'subcategories'
    await supabase.from(table).delete().eq('id', deleteModal.id)
    setSaving(false)
    setDeleteModal({ open: false })
    if (deleteModal.type === 'category') {
      setOpenCategories((prev) => {
        const next = new Set(prev)
        next.delete(deleteModal.id!)
        return next
      })
    }
    fetchData()
  }

  // Pre-index subcategories by category_id to avoid repeated filtering during render
  const subcategoriesByCategoryId = subcategories.reduce<Record<string, Subcategory[]>>((acc, sub) => {
    (acc[sub.category_id] ||= []).push(sub)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-honey-100">
        <div className="loading-avatar w-20 h-20 rounded-2xl border-2 border-honey-300 shadow-sm">
          <img
            src="/erik-anne-drinks.png"
            alt=""
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
        <p className="mt-4 text-sm text-gray-400 font-medium">Laden...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 bg-honey-100">
        <h1 className="page-title">Categorie&euml;n</h1>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-honey-100 mb-4">
            <Tags className="h-8 w-8 text-honey-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Geen categorie&euml;n</h3>
          <p className="text-gray-500 mb-4">Voeg je eerste categorie toe.</p>
          <Button onClick={() => { setAddName(''); setAddModal(true) }}>
            <Plus className="h-4 w-4 mr-1" />
            Categorie toevoegen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const subs = subcategoriesByCategoryId[cat.id] || []
            const isOpen = openCategories.has(cat.id)
            const count = recipeCounts[cat.id] || 0

            return (
              <div
                key={cat.id}
                className={cn(
                  'bg-white rounded-xl shadow-sm border transition-colors',
                  isOpen ? 'border-honey-300 ring-1 ring-honey-200' : 'border-gray-100'
                )}
              >
                {/* Category Header */}
                <div className="flex items-center gap-2 px-4 py-3 sm:px-5">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    aria-expanded={isOpen}
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200',
                        isOpen ? 'rotate-0' : '-rotate-90'
                      )}
                    />
                    <span className="text-base font-semibold text-gray-900 truncate">
                      {cat.name}
                      <span className="ml-1.5 text-sm font-normal text-gray-400">
                        ({count} {count === 1 ? 'recept' : 'recepten'})
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditModal(cat)
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-honey-700 hover:bg-honey-50 transition-colors"
                      title="Bewerken"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteModal({ open: true, type: 'category', id: cat.id, name: cat.name })
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories — collapsible */}
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
                    <div className="flex flex-wrap gap-2">
                      {subs.length === 0 && (
                        <span className="text-sm text-gray-400 italic">
                          Geen subcategorie&euml;n
                        </span>
                      )}
                      {subs.map((sub) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center rounded-full bg-honey-50 px-3 py-1.5 text-sm font-medium text-honey-700"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add category button — below the list */}
      <button
        onClick={() => { setAddName(''); setAddModal(true) }}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-honey-300 text-honey-700 font-medium hover:bg-honey-50 hover:border-honey-400 transition-colors"
      >
        <Plus className="h-5 w-5" />
        Categorie toevoegen
      </button>

      {/* Add Category Modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Nieuwe categorie"
      >
        <div className="space-y-4">
          <Input
            label="Naam"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="bijv. Hoofdmaaltijden"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && saveNewCategory()}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAddModal(false)}>
              Annuleren
            </Button>
            <Button onClick={saveNewCategory} loading={saving} disabled={!addName.trim()}>
              Toevoegen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal — edit name + all subcategories */}
      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false })}
        title="Categorie bewerken"
      >
        <div className="space-y-5">
          {/* Category name */}
          <Input
            label="Categorienaam"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="bijv. Hoofdmaaltijden"
            autoFocus
          />

          {/* Subcategories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategorie&euml;n
            </label>
            <div className="space-y-2">
              {editSubs.map((sub, index) => (
                <div key={sub.id || `new-${index}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => updateSubName(index, e.target.value)}
                    placeholder="Subcategorie naam..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeSub(index)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSub}
              className="mt-2 inline-flex items-center gap-1 text-sm text-honey-700 hover:text-honey-800 font-medium"
            >
              <Plus className="h-4 w-4" />
              Subcategorie toevoegen
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" onClick={() => setEditModal({ open: false })}>
              Annuleren
            </Button>
            <Button onClick={saveEditModal} loading={saving} disabled={!editName.trim()}>
              Opslaan
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
