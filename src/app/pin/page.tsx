'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { Delete } from 'lucide-react'
import { verifyPin } from './actions'

const PIN_LENGTH = 4

const rows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [null, '0', 'back'],
]

export default function PinPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pin, setPin] = useState('')
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const pinRef = useRef(pin)
  pinRef.current = pin

  const submit = useCallback((fullPin: string) => {
    setError(null)
    const formData = new FormData()
    formData.set('pin', fullPin)
    startTransition(async () => {
      const result = await verifyPin(formData)
      if (result?.error) {
        setError(result.error)
        setPin('')
      }
    })
  }, [startTransition])

  const handleDigit = useCallback((digit: string) => {
    if (isPending) return
    const current = pinRef.current
    if (current.length >= PIN_LENGTH) return
    const newPin = current + digit
    setPressedKey(digit)
    setTimeout(() => setPressedKey(null), 200)
    setPin(newPin)
    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => submit(newPin), 150)
    }
  }, [isPending, submit])

  const handleBackspace = useCallback(() => {
    if (isPending) return
    setPin(prev => prev.slice(0, -1))
    setError(null)
  }, [isPending])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
      else if (e.key === 'Backspace') handleBackspace()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDigit, handleBackspace])

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', backgroundColor: '#FFFBE6' }}>
      {/* Mobile: foto achtergrond */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'url(/erik-anne-eten.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.45,
        }}
      />
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(255,251,230,0.15) 0%, rgba(255,251,230,0.5) 50%, rgba(255,251,230,0.92) 100%)',
        }}
      />

      {/* Desktop: foto links */}
      <div
        className="hidden md:block"
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '55%' }}
      >
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(/erik-anne-eten.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, right: '6px', width: '60px',
            background: 'linear-gradient(to right, transparent, #FFFBE6)',
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: 'absolute', top: 0, bottom: 0, right: 0, width: '6px',
            backgroundColor: '#FFD633', zIndex: 3,
          }}
        />
      </div>

      {/* Numpad — ONE instance, positioned via CSS */}
      <div
        className="md:ml-[55%]"
        style={{
          position: 'relative', zIndex: 10,
          height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Desktop: white card wrapper */}
        <div className="md:bg-white md:rounded-3xl md:shadow-[0_4px_24px_rgba(0,0,0,0.06)] md:p-10 md:pb-9 md:max-w-[360px] flex flex-col items-center">
          {/* Desktop only: icon */}
          <img
            src="/icon.svg"
            alt="Recepten van Anne"
            className="hidden md:block"
            style={{ width: '56px', height: '56px', marginBottom: '16px' }}
          />

          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>Recepten van Anne</h1>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '4px', marginBottom: '32px' }}>Voer je pincode in</p>

          {/* PIN dots */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  transition: 'all 0.15s',
                  ...(i < pin.length
                    ? { backgroundColor: '#BF9A14' }
                    : { border: '2px solid #ccc', backgroundColor: 'transparent' }
                  ),
                }}
              />
            ))}
          </div>

          {/* Error */}
          <div style={{ height: '28px', display: 'flex', alignItems: 'center' }}>
            {error && <p style={{ fontSize: '14px', color: '#ef4444', fontWeight: 500 }}>{error}</p>}
          </div>

          {/* Number pad */}
          <table style={{ borderSpacing: '12px', borderCollapse: 'separate', marginTop: '8px' }}>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((key, ci) => (
                    <td key={ci} style={{ padding: 0 }}>
                      {key === null ? (
                        <div style={{ width: '72px', height: '52px' }} />
                      ) : key === 'back' ? (
                        <button
                          type="button"
                          onClick={handleBackspace}
                          disabled={isPending || pin.length === 0}
                          style={{
                            width: '72px', height: '52px', borderRadius: '12px',
                            border: 'none', background: 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            opacity: pin.length === 0 ? 0.3 : 1,
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          <Delete style={{ width: '20px', height: '20px', color: '#999' }} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDigit(key)}
                          disabled={isPending}
                          style={{
                            width: '72px', height: '52px', borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.06)',
                            background: pressedKey === key ? '#FFD633' : 'rgba(255,255,255,0.85)',
                            boxShadow: pressedKey === key ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                            fontSize: '22px', fontWeight: 600,
                            color: pressedKey === key ? '#4D3C08' : '#333',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                          }}
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
    </div>
  )
}
