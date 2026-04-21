'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScanFace, AlertCircle, KeyRound, Hourglass } from 'lucide-react'
import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser'

type Stage = 'loading' | 'login' | 'pending' | 'working'

function hasPendingCookie() {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some(c => c.startsWith('webauthn-pending=1'))
}

export default function PinPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [hasApproved, setHasApproved] = useState(false)
  const [busy, setBusy] = useState(false)

  const goHome = useCallback(() => {
    router.replace('/')
    router.refresh()
  }, [router])

  const handleFaceIdLogin = useCallback(async () => {
    if (busy) return
    setBusy(true)
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
        if (verifyRes.status === 403 && j?.pending) {
          setStage('pending')
          setBusy(false)
          return
        }
        throw new Error(j.error ?? 'Verificatie mislukt')
      }
      setStage('working')
      goHome()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Face ID mislukt'
      if (!/cancel|abort|NotAllowed/i.test(msg)) {
        setError(msg)
      }
      setBusy(false)
    }
  }, [busy, goHome])

  const handleRegister = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const optsRes = await fetch('/api/webauthn/register/options', { method: 'POST' })
      if (!optsRes.ok) {
        const j = await optsRes.json().catch(() => ({}))
        throw new Error(j.error ?? 'Kon passkey niet registreren')
      }
      const options = await optsRes.json()
      const attestation = await startRegistration({ optionsJSON: options })
      const verifyRes = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: attestation, deviceLabel: navigator.platform }),
      })
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}))
        throw new Error(j.error ?? 'Registratie mislukt')
      }
      setStage('pending')
      setBusy(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registratie mislukt'
      if (!/cancel|abort|NotAllowed/i.test(msg)) {
        setError(msg)
      }
      setBusy(false)
    }
  }, [busy])

  useEffect(() => {
    let cancelled = false
    async function init() {
      if (hasPendingCookie()) {
        if (!cancelled) setStage('pending')
        return
      }
      try {
        const res = await fetch('/api/webauthn/status')
        const data = await res.json()
        if (cancelled) return
        setHasApproved(Boolean(data?.hasApproved))
        setStage('login')
      } catch {
        if (!cancelled) setStage('login')
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  if (stage === 'loading' || stage === 'working') {
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

      {stage === 'pending' && (
        <div className="flex flex-col items-center max-w-xs text-center">
          <Hourglass className="w-10 h-10 text-honey-800 mb-3" strokeWidth={1.25} />
          <p className="text-sm text-gray-700 font-medium">
            Dit apparaat is aangemeld.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Erik moet 'm nog goedkeuren voor je kan inloggen.
          </p>
          <button
            type="button"
            onClick={handleFaceIdLogin}
            disabled={busy}
            style={{ touchAction: 'manipulation' }}
            className="mt-6 inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-white text-gray-800 text-sm font-semibold border border-honey-200 shadow-sm hover:bg-honey-50 active:bg-honey-100 disabled:opacity-50"
          >
            {busy ? 'Bezig…' : 'Probeer opnieuw'}
          </button>
        </div>
      )}

      {stage === 'login' && hasApproved && (
        <>
          <button
            type="button"
            onClick={handleFaceIdLogin}
            disabled={busy}
            aria-label="Ontgrendel met Face ID"
            style={{ touchAction: 'manipulation' }}
            className="flex flex-col items-center gap-4 p-6 -m-6 rounded-full disabled:opacity-50"
          >
            <ScanFace
              className={`w-14 h-14 text-honey-800 ${busy ? 'animate-pulse' : 'breathe'}`}
              strokeWidth={1.25}
            />
            <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
              {busy ? 'Bezig' : 'Face ID'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleRegister}
            disabled={busy}
            className="mt-10 text-xs text-gray-500 underline underline-offset-4 hover:text-gray-700 disabled:opacity-50"
          >
            Nieuw apparaat? Registreer hier
          </button>
        </>
      )}

      {stage === 'login' && !hasApproved && (
        <button
          type="button"
          onClick={handleRegister}
          disabled={busy}
          style={{ touchAction: 'manipulation' }}
          className="inline-flex items-center gap-2 px-5 h-12 rounded-xl bg-honey-500 text-honey-950 font-bold shadow-md ring-1 ring-honey-600/30 hover:bg-honey-400 active:bg-honey-600 disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" strokeWidth={2} />
          {busy ? 'Bezig…' : 'Registreer passkey'}
        </button>
      )}

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
