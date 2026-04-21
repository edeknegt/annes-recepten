'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Delete } from 'lucide-react'
import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser'
import { verifyPin } from './actions'

const PIN_LENGTH = 4

const rows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [null, '0', 'back'],
]

type Stage = 'pin' | 'enrollPrompt' | 'working'

function hasEnrolledCookie() {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some(c => c.startsWith('webauthn-enrolled=1'))
}

export default function PinPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pin, setPin] = useState('')
  const [stage, setStage] = useState<Stage>('pin')
  const [webauthnSupported, setWebauthnSupported] = useState(false)
  const [hasPasskey, setHasPasskey] = useState(false)
  const [faceIdBusy, setFaceIdBusy] = useState(false)
  const pinRef = useRef(pin)
  pinRef.current = pin

  useEffect(() => {
    const supported = browserSupportsWebAuthn()
    setWebauthnSupported(supported)
    setHasPasskey(supported && hasEnrolledCookie())
  }, [])

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
        if (optsRes.status === 404) setHasPasskey(false)
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

  const handleEnroll = useCallback(async () => {
    setFaceIdBusy(true)
    setError(null)
    try {
      const optsRes = await fetch('/api/webauthn/register/options', { method: 'POST' })
      if (!optsRes.ok) {
        const j = await optsRes.json().catch(() => ({}))
        throw new Error(j.error ?? 'Kon Face ID niet instellen')
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
      setStage('working')
      goHome()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Face ID instellen mislukt'
      if (/cancel|abort|NotAllowed/i.test(msg)) {
        goHome()
      } else {
        setError(msg)
        setFaceIdBusy(false)
      }
    }
  }, [goHome])

  const submit = useCallback((fullPin: string) => {
    setError(null)
    const formData = new FormData()
    formData.set('pin', fullPin)
    startTransition(async () => {
      const result = await verifyPin(formData)
      if (result?.error) {
        setError(result.error)
        setPin('')
        return
      }
      // PIN success
      if (webauthnSupported && !hasEnrolledCookie()) {
        setStage('enrollPrompt')
      } else {
        setStage('working')
        goHome()
      }
    })
  }, [startTransition, webauthnSupported, goHome])

  const handleDigit = useCallback((digit: string) => {
    if (isPending) return
    const current = pinRef.current
    if (current.length >= PIN_LENGTH) return
    const newPin = current + digit
    setPin(newPin)
    if (newPin.length === PIN_LENGTH) {
      submit(newPin)
    }
  }, [isPending, submit])

  const handleBackspace = useCallback(() => {
    if (isPending) return
    setPin(prev => prev.slice(0, -1))
    setError(null)
  }, [isPending])

  useEffect(() => {
    if (stage !== 'pin') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
      else if (e.key === 'Backspace') handleBackspace()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDigit, handleBackspace, stage])

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

  if (stage === 'enrollPrompt') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-honey-100 p-4">
        <div className="w-full max-w-xs bg-white rounded-3xl shadow-lg border border-honey-200 py-10 px-6 flex flex-col items-center text-center">
          <img
            src="/erik-anne-drinks.png"
            alt=""
            className="w-24 h-24 rounded-2xl shadow-sm border-2 border-honey-200 mb-5"
          />
          <h1 className="text-xl font-bold text-gray-900">Face ID instellen?</h1>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Log de volgende keer sneller in met Face ID of Touch ID op dit apparaat.
          </p>
          {error && <p className="text-sm text-red-500 font-medium mb-3">{error}</p>}
          <button
            type="button"
            onClick={handleEnroll}
            disabled={faceIdBusy}
            style={{ touchAction: 'manipulation' }}
            className="w-full h-12 rounded-xl bg-honey-700 text-white font-semibold hover:bg-honey-800 active:bg-honey-900 disabled:opacity-50"
          >
            {faceIdBusy ? 'Bezig...' : 'Ja, instellen'}
          </button>
          <button
            type="button"
            onClick={() => { setStage('working'); goHome() }}
            disabled={faceIdBusy}
            style={{ touchAction: 'manipulation' }}
            className="w-full h-12 mt-2 rounded-xl text-gray-600 font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            Nu niet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-honey-100 p-4">
      <div className="w-full max-w-xs bg-white rounded-3xl shadow-lg border border-honey-200 py-10 px-6 flex flex-col items-center">
        <img
          src="/erik-anne-drinks.png"
          alt="Recepten van Anne"
          className="w-24 h-24 rounded-2xl shadow-sm border-2 border-honey-200 mb-5"
        />

        <h1 className="text-xl font-bold text-gray-900">Recepten van Anne</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">Voer je pincode in</p>

        {hasPasskey && (
          <button
            type="button"
            onClick={handleFaceIdLogin}
            disabled={faceIdBusy || isPending}
            style={{ touchAction: 'manipulation' }}
            className="w-full h-11 mb-5 rounded-xl bg-honey-700 text-white font-semibold hover:bg-honey-800 active:bg-honey-900 disabled:opacity-50"
          >
            {faceIdBusy ? 'Bezig...' : 'Ontgrendel met Face ID'}
          </button>
        )}

        <div className="flex gap-5 mb-3">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                i < pin.length
                  ? 'bg-honey-700 scale-110'
                  : 'border-2 border-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="h-7 flex items-center">
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </div>

        <table style={{ borderSpacing: '10px 8px', borderCollapse: 'separate', marginTop: '4px' }}>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((key, ci) => (
                  <td key={ci} style={{ padding: 0 }}>
                    {key === null ? (
                      <div className="w-[72px] h-[50px]" />
                    ) : key === 'back' ? (
                      <button
                        type="button"
                        onPointerDown={handleBackspace}
                        disabled={isPending || pin.length === 0}
                        style={{ touchAction: 'manipulation' }}
                        className="w-[72px] h-[50px] rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30"
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onPointerDown={() => handleDigit(key)}
                        disabled={isPending}
                        style={{ touchAction: 'manipulation' }}
                        className="w-[72px] h-[50px] rounded-xl text-xl font-semibold bg-honey-50 text-gray-800 hover:bg-honey-100 active:bg-honey-500 active:text-honey-950"
                      >
                        {key}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
