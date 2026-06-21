import { Suspense } from 'react'
import { Key } from 'lucide-react'
import { listApiKeys } from '@/actions/api-keys'
import ApiKeysClient from './ApiKeysClient'

async function ApiKeysList() {
  const keys = await listApiKeys()
  return <ApiKeysClient initialKeys={keys} />
}

export default function ApiSettingsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">API Keys</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          Create keys to trigger print jobs from external systems.
        </p>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-24">
          <Key className="w-8 h-8 text-zinc-300 animate-pulse" />
        </div>
      }>
        <ApiKeysList />
      </Suspense>
    </div>
  )
}
