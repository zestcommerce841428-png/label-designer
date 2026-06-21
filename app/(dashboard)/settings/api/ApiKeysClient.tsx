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
    <div className="space-y-6 max-w-3xl">
      {/* New key revealed once */}
      {newKey && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold">
              Copy this key now — it will not be shown again.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[var(--bg-card)] rounded-xl border border-amber-200 dark:border-amber-800 px-3 py-2.5">
            <code className="text-xs text-[var(--fg)] flex-1 break-all font-mono">{newKey}</code>
            <button
              type="button"
              onClick={() => copyKey(newKey)}
              className="shrink-0 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
              title="Copy key"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNewKey(null)}
            className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
          >
            I&apos;ve copied it — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
        <h2 className="text-sm font-semibold text-[var(--fg)] mb-3">Create new API key</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Key name, e.g. Production webhook"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            maxLength={100}
            aria-label="API key name"
            className="flex-1 text-sm border border-[var(--border)] rounded-xl px-3.5 py-2.5 bg-[var(--bg-subtle)] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Create
          </button>
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
      </div>

      {/* Key list */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
        {keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center mb-3">
              <Key className="w-5 h-5 text-[var(--fg-subtle)]" />
            </div>
            <p className="text-sm text-[var(--fg-muted)]">No API keys yet</p>
            <p className="text-xs text-[var(--fg-subtle)] mt-1">Create one above to start using the API.</p>
          </div>
        ) : (
          <table className="w-full text-sm overflow-x-auto">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Key</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Last used</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Created</th>
                <th className="px-4 py-3" scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--fg)]">{k.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border)] px-2 py-0.5 rounded-lg font-mono">
                      {k.key_prefix}…
                    </code>
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-subtle)] text-xs">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-subtle)] text-xs">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(k.id)}
                      disabled={isPending}
                      title="Delete key"
                      className="text-[var(--fg-subtle)] hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-40 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Usage docs */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--fg)]">API usage</h2>
        <p className="text-xs text-[var(--fg-muted)]">
          Use your API key to trigger print jobs from external systems or automation workflows.
        </p>
        <div className="space-y-1 text-xs font-mono bg-[var(--bg-subtle)] rounded-xl border border-[var(--border)] p-4 text-[var(--fg-muted)] leading-relaxed overflow-x-auto">
          <p className="text-[var(--fg-subtle)]"># Log a print job for a label</p>
          <p className="text-[var(--fg)]">POST /api/v1/labels/{'<label-id>'}/print</p>
          <p>Authorization: Bearer lf_live_...</p>
          <p>Content-Type: application/json</p>
          <br />
          <p className="text-[var(--fg)]">{'{'}</p>
          <p>&nbsp;&nbsp;&quot;rows&quot;: [{'{'} &quot;name&quot;: &quot;Alice&quot;, &quot;sku&quot;: &quot;X100&quot; {'}'}]</p>
          <p className="text-[var(--fg)]">{'}'}</p>
        </div>
        <p className="text-xs text-[var(--fg-subtle)]">
          Your label ID is in the editor URL:{' '}
          <code className="bg-[var(--bg-subtle)] border border-[var(--border)] px-1 rounded">/editor/{'<label-id>'}</code>
        </p>
      </div>
    </div>
  )
}
