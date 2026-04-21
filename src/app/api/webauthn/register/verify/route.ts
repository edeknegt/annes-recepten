import { cookies } from 'next/headers'
import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { isoBase64URL } from '@simplewebauthn/server/helpers'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import {
  CHALLENGE_COOKIE,
  ENROLLED_COOKIE,
  ENROLLED_MAX_AGE,
  PENDING_COOKIE,
  PENDING_MAX_AGE,
  getWebAuthnConfig,
} from '@/lib/webauthn/config'
import { insertCredential } from '@/lib/webauthn/store'

export async function POST(request: Request) {
  const store = await cookies()
  const expectedChallenge = store.get(CHALLENGE_COOKIE)?.value
  if (!expectedChallenge) {
    return Response.json({ error: 'Challenge ontbreekt' }, { status: 400 })
  }

  const body = (await request.json()) as {
    response: RegistrationResponseJSON
    deviceLabel?: string
  }

  const { rpID, origin } = getWebAuthnConfig()

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Verificatie mislukt' },
      { status: 400 }
    )
  }

  if (!verification.verified || !verification.registrationInfo) {
    return Response.json({ error: 'Registratie niet geverifieerd' }, { status: 400 })
  }

  const { credential } = verification.registrationInfo

  await insertCredential({
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? null,
    device_label: body.deviceLabel?.slice(0, 60) ?? null,
  })

  store.delete(CHALLENGE_COOKIE)
  store.set(ENROLLED_COOKIE, '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ENROLLED_MAX_AGE,
    path: '/',
  })
  store.set(PENDING_COOKIE, '1', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PENDING_MAX_AGE,
    path: '/',
  })

  return Response.json({ ok: true, pending: true })
}
