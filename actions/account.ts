'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateDisplayName(name: string) {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length > 100) {
    throw new Error('Display name must be 1–100 characters')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.auth.updateUser({
    data: { display_name: trimmed },
  })
  if (error) throw error

  revalidatePath('/settings')
}

export async function changePassword(currentPassword: string, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters')
  }
  if (currentPassword === newPassword) {
    throw new Error('New password must be different from your current password')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify current password by re-signing in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  if (verifyError) throw new Error('Current password is incorrect')

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Supabase service role is needed to delete a user from auth.users
  // Using admin client with service role key
  const { createClient: createAdmin } = await import('@supabase/supabase-js')
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // User data cascades via FK (labels, print_jobs, data_sources, api_keys)
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) throw error

  await supabase.auth.signOut()
  redirect('/login')
}
