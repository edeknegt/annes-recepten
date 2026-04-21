import { getApprovedCredentials } from '@/lib/webauthn/store'

export async function GET() {
  const approved = await getApprovedCredentials()
  return Response.json({ hasApproved: approved.length > 0 })
}
