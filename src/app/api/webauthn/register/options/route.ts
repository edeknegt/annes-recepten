import { cookies } from 'next/headers'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import {
  CHALLENGE_COOKIE,
  CHALLENGE_MAX_AGE,
  getWebAuthnConfig,
} from '@/lib/webauthn/config'
import { getAllCredentials, isRegistrationOpen } from '@/lib/webauthn/store'

export async function POST() {
  if (!(await isRegistrationOpen())) {
    return Response.json(
      { error: 'Registratie staat nu dicht. Vraag Erik om hem te openen.' },
      { status: 403 }
    )
  }

  const { rpID, rpName } = getWebAuthnConfig()
  const existing = await getAllCredentials()

  const options = await generateRegistrationOptions({
    rpID,
    rpName,
    userName: 'anne-familie',
    userDisplayName: 'Anne',
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
    excludeCredentials: existing.map(c => ({
      id: c.credential_id,
      transports: (c.transports ?? undefined) as
        | ('internal' | 'hybrid' | 'usb' | 'nfc' | 'ble' | 'cable' | 'smart-card')[]
        | undefined,
    })),
  })

  const store = await cookies()
  store.set(CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CHALLENGE_MAX_AGE,
    path: '/',
  })

  return Response.json(options)
}
