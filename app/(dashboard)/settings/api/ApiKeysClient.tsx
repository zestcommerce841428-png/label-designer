'use client'

import { useState, useTransition } from 'react'
import { Key, Trash2, Plus, Copy, Check, AlertTriangle } from 'lucide-react'
import { createApiKey, deleteApiKey } from '@/actions/api-keys'
import { useRouter } from 'next/navigation'

type ApiKey = {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
}

export default function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const router = useRouter()
  const [keys, setKeys] = useState(initialKeys)
  const [newName, setNewName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!newName.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        const { raw } = await createApiKey(newName.trim())
        setNewKey(raw)
        setNewName('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create key')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this API key? Any integrations using it will stop working.')) return
    startTransition(async () => {
      try {
        await deleteApiKey(id)
        setKeys(prev => prev.filter(k => k.id !== id))
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete key')
      }
    })
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* New key revealed once */}
      {newKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              Copy this key now — it will not be shown again.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-amber-200 px-3 py-2">
            <code className="text-xs text-zinc-800 flex-1 break-all font-mono">{newKey}</code>
            <button
              type="button"
              onClick={() => copyKey(newKey)}
              className="shrink-0 text-zinc-500 hover:text-zinc-900 transition-colors"
              title="Copy key"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNewKey(null)}
            className="text-xs text-amber-700 hover:underline"
          >
            I&apos;ve copied it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Create new API key</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Key name, e.g. Production webhook"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            maxLength={100}
            className="flex-1 text-sm border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>

      {/* Key list */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Key className="w-8 h-8 text-zinc-300 mb-3" />
            <p className="text-sm text-zinc-400">No API keys yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Key</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Last used</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{k.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">
                      {k.key_prefix}…
                    </code>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(k.id)}
                      disabled={isPending}
                      title="Delete key"
                      className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Usage docs */}
      <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">API usage</h2>
        <p className="text-xs text-zinc-600">
          Use your API key to trigger print jobs from external systems or automation workflows.
        </p>
        <div className="space-y-2 text-xs font-mono bg-white rounded-lg border border-zinc-200 p-3 text-zinc-700 leading-relaxed">
          <p className="text-zinc-400"># Log a print job for a label</p>
          <p>POST /api/v1/labels/{'<label-id>'}/print</p>
          <p>Authorization: Bearer lf_live_...</p>
          <p>Content-Type: application/json</p>
          <br />
          <p>{'{'}</p>
          <p>&nbsp;&nbsp;&quot;rows&quot;: [</p>
          <p>&nbsp;&nbsp;&nbsp;&nbsp;{'{'}  &quot;name&quot;: &quot;Alice&quot;, &quot;sku&quot;: &quot;X100&quot; {'}'}</p>
          <p>&nbsp;&nbsp;]</p>
          <p>{'}'}</p>
        </div>
        <p className="text-xs text-zinc-500">
          Your label ID is in the editor URL: <code className="bg-zinc-100 px-1 rounded">/editor/{'<label-id>'}</code>
        </p>
      </div>
    </div>
  )
}
