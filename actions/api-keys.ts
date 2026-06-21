'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Generate a cryptographically random API key and return its SHA-256 hash */
async function generateKey(): Promise<{ raw: string; hash: string; prefix: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const raw = `lf_live_${hex}`
  const prefix = raw.slice(0, 16)

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  return { raw, hash, prefix }
}

export async function createApiKey(name: string): Promise<{ raw: string }> {
  if (!name || name.length > 100) throw new Error('Key name must be 1–100 characters')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { raw, hash, prefix } = await generateKey()

  const { error } = await supabase.from('api_keys').insert({
    user_id: user.id,
    name: name.trim(),
    key_prefix: prefix,
    key_hash: hash,
  })
  if (error) throw error

  revalidatePath('/settings/api')
  // raw is returned ONCE for the user to copy — never stored plain
  return { raw }
}

export async function deleteApiKey(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('api_keys').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/settings/api')
}

export async function listApiKeys() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}
