import 'server-only'

const RP_NAME = "Anne's keuken"

export function getWebAuthnConfig() {
  const rpID = process.env.WEBAUTHN_RP_ID
  const origin = process.env.WEBAUTHN_ORIGIN

  if (!rpID || !origin) {
    throw new Error(
      'Missing WEBAUTHN_RP_ID or WEBAUTHN_ORIGIN env vars'
    )
  }

  return { rpID, origin, rpName: RP_NAME }
}

export const CHALLENGE_COOKIE = 'webauthn-challenge'
export const PENDING_COOKIE = 'webauthn-pending'
export const CHALLENGE_MAX_AGE = 60 * 5 // 5 min
export const PENDING_MAX_AGE = 60 * 60 * 24 * 30 // 30 dagen
