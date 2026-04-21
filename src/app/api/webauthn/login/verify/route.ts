import { cookies } from 'next/headers'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { setPinSession } from '@/lib/webauthn/auth'
import {
  CHALLENGE_COOKIE,
  ENROLLED_COOKIE,
  ENROLLED_MAX_AGE,
  getWebAuthnConfig,
} from '@/lib/webauthn/config'
import {
  getCredentialById,
  updateCredentialCounter,
} from '@/lib/webauthn/store'

export async function POST(request: Request) {
  const store = await cookies()
  const expectedChallenge = store.get(CHALLENGE_COOKIE)?.value
  if (!expectedChallenge) {
    return Response.json({ error: 'Challenge ontbreekt' }, { status: 400 })
  }

  const body = (await request.json()) as {
    response: AuthenticationResponseJSON
  }

  const credential = await getCredentialById(body.response.id)
  if (!credential) {
    return Response.json({ error: 'Onbekende passkey' }, { status: 404 })
  }

  const { rpID, origin } = getWebAuthnConfig()

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: credential.credential_id,
        publicKey: isoBase64URL.toBuffer(credential.public_key),
        counter: Number(credential.counter),
        transports: (credential.transports ?? undefined) as
          | ('internal' | 'hybrid' | 'usb' | 'nfc' | 'ble' | 'cable' | 'smart-card')[]
          | undefined,
      },
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Verificatie mislukt' },
      { status: 400 }
    )
  }

  if (!verification.verified) {
    return Response.json({ error: 'Niet geverifieerd' }, { status: 400 })
  }

  await updateCredentialCounter(
    credential.credential_id,
    verification.authenticationInfo.newCounter
  )

  store.delete(CHALLENGE_COOKIE)
  await setPinSession()
  store.set(ENROLLED_COOKIE, '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ENROLLED_MAX_AGE,
    path: '/',
  })

  return Response.json({ ok: true })
}
