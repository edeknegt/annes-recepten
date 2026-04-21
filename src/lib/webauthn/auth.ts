import 'server-only'
import { cookies } from 'next/headers'

export const PIN_COOKIE = 'annes-recepten-auth'
export const PIN_SESSION_MAX_AGE = 60 * 15 // 15 min, zelfde als middleware/pin-action

export async function hasValidPinSession() {
  const store = await cookies()
  return store.get(PIN_COOKIE)?.value === 'authenticated'
}

export async function setPinSession() {
  const store = await cookies()
  store.set(PIN_COOKIE, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PIN_SESSION_MAX_AGE,
    path: '/',
  })
}
