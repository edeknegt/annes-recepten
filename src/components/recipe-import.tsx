'use client'

import { useState, useTransition } from 'react'
import { Link2, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { importRecipe, type ImportedRecipe } from '@/app/(app)/recepten/nieuw/actions'

interface RecipeImportProps {
  onImport: (data: ImportedRecipe) => void
}

export function RecipeImport({ onImport }: RecipeImportProps) {
  const [url, setUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    if (!url.trim()) return
    setError(null)

    startTransition(async () => {
      const result = await importRecipe(url.trim())
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        onImport(result.data)
        setUrl('')
      }
    })
  }

  return (
    <Card className="border-honey-200 bg-honey-50/50">
      <CardContent className="py-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-honey-600" />
          <h2 className="text-base font-semibold text-gray-900">Recept importeren</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Plak een link naar een recept en we vullen alles automatisch in.
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleImport()}
              placeholder="https://www.ah.nl/allerhande/recept/..."
              disabled={isPending}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500 disabled:opacity-50"
            />
          </div>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!url.trim() || isPending}
            size="md"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Ophalen...
              </>
            ) : (
              'Importeren'
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isPending && (
          <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-honey-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-honey-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-honey-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            Recept wordt opgehaald en geanalyseerd...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
