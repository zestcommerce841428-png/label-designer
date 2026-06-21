import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import AccountSettingsClient from './AccountSettingsClient'

export const metadata: Metadata = { title: 'Account Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? ''

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Account Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
      </div>
      <Suspense>
        <AccountSettingsClient
          email={user?.email ?? ''}
          displayName={displayName}
        />
      </Suspense>
    </div>
  )
}
