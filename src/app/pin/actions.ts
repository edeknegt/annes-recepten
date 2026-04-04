'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function verifyPin(formData: FormData) {
  const pin = formData.get('pin') as string
  const correctPin = process.env.APP_PIN

  if (!correctPin) {
    return { error: 'PIN is niet geconfigureerd. Neem contact op met de beheerder.' }
  }

  if (pin !== correctPin) {
    return { error: 'Onjuiste pincode' }
  }

  const cookieStore = await cookies()
  cookieStore.set('annes-recepten-auth', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })

  redirect('/')
}
