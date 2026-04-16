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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
      else if (e.key === 'Backspace') handleBackspace()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDigit, handleBackspace])

  if (isPending) {
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
    <div className="fixed inset-0 flex items-center justify-center bg-honey-100 p-4">
      {/* Card */}
      <div className="w-full max-w-xs bg-white rounded-3xl shadow-lg border border-honey-200 py-10 px-6 flex flex-col items-center">
        {/* Logo */}
        <img
          src="/erik-anne-drinks.png"
          alt="Recepten van Anne"
          className="w-24 h-24 rounded-2xl shadow-sm border-2 border-honey-200 mb-5"
        />

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900">Recepten van Anne</h1>
        <p className="text-sm text-gray-500 mt-1 mb-8">Voer je pincode in</p>

        {/* PIN dots */}
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

        {/* Error */}
        <div className="h-7 flex items-center">
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </div>

        {/* Number pad */}
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
                        className="w-[72px] h-[50px] rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30"
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onPointerDown={() => handleDigit(key)}
                        disabled={isPending}
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
