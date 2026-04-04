'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { createClient } from '@/lib/supabase/client'

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('recipes').delete().eq('id', recipeId)
      router.push('/recepten')
      router.refresh()
    })
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
        <Trash2 className="h-4 w-4 mr-1" />
        Verwijderen
      </Button>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Recept verwijderen">
        <p className="text-gray-600 mb-6">
          Weet je zeker dat je dit recept wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowConfirm(false)}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={isPending}>
            Verwijderen
          </Button>
        </div>
      </Modal>
    </>
  )
}
