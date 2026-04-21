'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScanFace, AlertCircle } from 'lucide-react'
import { startAuthentication } from '@simplewebauthn/browser'

type Stage = 'login' | 'working'

export default function PinPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('login')
  const [faceIdBusy, setFaceIdBusy] = useState(false)

  const goHome = useCallback(() => {
    router.replace('/')
    router.refresh()
  }, [router])

  const handleFaceIdLogin = useCallback(async () => {
    if (faceIdBusy) return
    setFaceIdBusy(true)
    setError(null)
    try {
      const optsRes = await fetch('/api/webauthn/login/options', { method: 'POST' })
      if (!optsRes.ok) {
        const j = await optsRes.json().catch(() => ({}))
        throw new Error(j.error ?? 'Face ID niet beschikbaar')
      }
      const options = await optsRes.json()
      const assertion = await startAuthentication({ optionsJSON: options })
      const verifyRes = await fetch('/api/webauthn/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: assertion }),
      })
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}))
        throw new Error(j.error ?? 'Verificatie mislukt')
      }
      setStage('working')
      goHome()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Face ID mislukt'
      if (!/cancel|abort|NotAllowed/i.test(msg)) {
        setError(msg)
      }
      setFaceIdBusy(false)
    }
  }, [faceIdBusy, goHome])

  useEffect(() => {
    handleFaceIdLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (stage === 'working') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-honey-100 p-4">
        <div className="flex flex-col items-center">
          <div className="loading-avatar w-24 h-24 rounded-2xl border-2 border-honey-300 shadow-sm">
            <img
              src="/erik-anne-drinks.png"
              alt=""
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <p className="mt-4 text-sm text-gray-400 font-medium">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center bg-honey-100 p-6 pt-[8vh]">
      <img
        src="/erik-anne-drinks.png"
        alt="Recepten"
        className="w-32 h-32 rounded-2xl shadow-md border-2 border-honey-200 mb-6"
      />
      <h1 className="text-2xl font-bold text-gray-900">Recepten</h1>
      <p className="text-sm text-gray-500 mt-1 mb-8">Hoi Anne!</p>

      <button
        type="button"
        onClick={handleFaceIdLogin}
        disabled={faceIdBusy}
        aria-label="Ontgrendel met Face ID"
        style={{ touchAction: 'manipulation' }}
        className="flex flex-col items-center gap-4 p-6 -m-6 rounded-full disabled:opacity-50"
      >
        <ScanFace
          className={`w-14 h-14 text-honey-800 ${faceIdBusy ? 'animate-pulse' : 'breathe'}`}
          strokeWidth={1.25}
        />
        <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
          {faceIdBusy ? 'Bezig' : 'Face ID'}
        </span>
      </button>

      <div className="h-8 mt-4 flex items-center">
        {error && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} />
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
