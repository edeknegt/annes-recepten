'use client'

import { useState, useTransition } from 'react'
import { CookingPot, Lock } from 'lucide-react'
import { verifyPin } from './actions'
import { Button } from '@/components/ui/button'

export default function PinPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await verifyPin(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-honey-50 to-honey-100 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-sm border border-honey-200 mb-4">
            <CookingPot className="h-10 w-10 text-honey-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Anne&apos;s Recepten</h1>
          <p className="text-sm text-gray-500 mt-1">Voer je pincode in om verder te gaan</p>
        </div>

        {/* PIN Form */}
        <form action={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-honey-200 p-6">
          <div className="mb-4">
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="inline h-4 w-4 mr-1 -mt-0.5" />
              Pincode
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              required
              autoFocus
              placeholder="••••"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-honey-500 focus:border-honey-500 placeholder:tracking-[0.3em] placeholder:text-gray-300"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={isPending}>
            Openen
          </Button>
        </form>
      </div>
    </div>
  )
}
