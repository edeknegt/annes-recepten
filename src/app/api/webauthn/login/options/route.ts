import { cookies } from 'next/headers'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import {
  CHALLENGE_COOKIE,
  CHALLENGE_MAX_AGE,
  getWebAuthnConfig,
} from '@/lib/webauthn/config'
import { getApprovedCredentials } from '@/lib/webauthn/store'

export async function POST() {
  const { rpID } = getWebAuthnConfig()
  const approved = await getApprovedCredentials()

  if (approved.length === 0) {
    return Response.json(
      { error: 'Nog geen goedgekeurde passkeys' },
      { status: 404 }
    )
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: approved.map(c => ({
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
