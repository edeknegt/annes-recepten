import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type StoredCredential = {
  id: string
  credential_id: string
  public_key: string
  counter: number
  transports: string[] | null
  device_label: string | null
}

export async function getAllCredentials(): Promise<StoredCredential[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('webauthn_credentials')
    .select('id, credential_id, public_key, counter, transports, device_label')
  if (error) throw error
  return (data ?? []) as StoredCredential[]
}

export async function getCredentialById(
  credentialId: string
): Promise<StoredCredential | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('webauthn_credentials')
    .select('id, credential_id, public_key, counter, transports, device_label')
    .eq('credential_id', credentialId)
    .maybeSingle()
  if (error) throw error
  return (data as StoredCredential | null) ?? null
}

export async function insertCredential(params: {
  credential_id: string
  public_key: string
  counter: number
  transports: string[] | null
  device_label: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('webauthn_credentials').insert(params)
  if (error) throw error
}

export async function updateCredentialCounter(
  credentialId: string,
  newCounter: number
) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('webauthn_credentials')
    .update({ counter: newCounter, last_used_at: new Date().toISOString() })
    .eq('credential_id', credentialId)
  if (error) throw error
}
