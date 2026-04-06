'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
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
    if (isPending || pin.length >= PIN_LENGTH) return
    setPressedKey(digit)
    setTimeout(() => setPressedKey(null), 200)
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === PIN_LENGTH) {
      setTimeout(() => submit(newPin), 150)
    }
  }, [isPending, pin, submit])

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

  const pinContent = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>Recepten van Anne</h1>
      <p style={{ fontSize: '14px', color: '#666', marginTop: '4px', marginBottom: '32px' }}>Voer je pincode in</p>

      {/* PIN dots */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
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
                        width: '72px',
                        height: '52px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
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
                        width: '72px',
                        height: '52px',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        background: pressedKey === key ? '#FFD633' : 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(4px)',
                        boxShadow: pressedKey === key ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                        fontSize: '22px',
                        fontWeight: 600,
                        color: pressedKey === key ? '#4D3C08' : '#333',
                        cursor: 'pointer',
                        transition: 'background 0.1s, color 0.1s',
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
  )

  return (
    <div style={{ height: '100dvh', overflow: 'hidden' }}>
      {/* ===== MOBILE: foto achtergrond + numpad ===== */}
      <div
        className="flex md:hidden flex-col items-center justify-center relative overflow-hidden"
        style={{ height: '100%', backgroundColor: '#FFFBE6' }}
      >
        <div
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
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(to bottom, rgba(255,251,230,0.15) 0%, rgba(255,251,230,0.5) 50%, rgba(255,251,230,0.92) 100%)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 10 }}>
          {pinContent}
        </div>
      </div>

      {/* ===== DESKTOP: split layout ===== */}
      <div
        className="hidden md:flex"
        style={{ height: '100%', backgroundColor: '#FFFBE6', width: '100%' }}
      >
        {/* Left: foto */}
        <div
          style={{
            width: '55%',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/erik-anne-eten.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          {/* Foto fade-out naar rechts */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: '3px',
              width: '60px',
              background: 'linear-gradient(to right, transparent, #FFFBE6)',
              zIndex: 2,
            }}
          />
          {/* Gele lijn — scherp */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '6px',
              backgroundColor: '#FFD633',
              zIndex: 3,
            }}
          />
        </div>

        {/* Right: PIN in card */}
        <div
          style={{
            width: '45%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '40px 36px 36px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '360px',
            }}
          >
            {/* Kookpan icoon */}
            <img
              src="/icon.svg"
              alt="Recepten van Anne"
              style={{ width: '56px', height: '56px', marginBottom: '16px' }}
            />
            {pinContent}
          </div>
        </div>
      </div>
    </div>
  )
}
