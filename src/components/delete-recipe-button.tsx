'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!showConfirm) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowConfirm(false)
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [showConfirm])

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

      {showConfirm && mounted && createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40"
          onClick={(e) => { if (e.target === overlayRef.current) setShowConfirm(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up"
          >
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Recept verwijderen?</h3>
              <p className="text-sm text-gray-500">
                Dit kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Annuleren
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDelete}
                loading={isPending}
              >
                Verwijderen
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
