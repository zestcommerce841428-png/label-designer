'use client'

import { useState } from 'react'
import { X, Printer } from 'lucide-react'

type Props = {
  fields: string[]          // merge tag names extracted from the canvas
  prefill?: Record<string, string> // values from current data row (if any)
  onPrint: (values: Record<string, string>) => void
  onClose: () => void
}

/** Guess a sensible input type from a field name. */
function guessInputType(field: string): 'date' | 'number' | 'text' {
  const f = field.toLowerCase()
  if (/date|expiry|expiration|mfg|manufactured|best.?before|dom|doe/.test(f)) return 'date'
  if (/qty|quantity|count|copies|pieces|weight|price|amount|rate|mrp|cost/.test(f)) return 'number'
  return 'text'
}

export default function DataEntryFormDialog({ fields, prefill = {}, onPrint, onClose }: Props) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f, prefill[f] ?? '']))
  )

  function set(field: string, value: string) {
    setValues(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onPrint(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">Data Entry Form</h2>
            <p className="text-xs text-[var(--fg-subtle)] mt-0.5">Fill in values before printing</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-5 py-4 space-y-3 flex-1">
            {fields.length === 0 ? (
              <p className="text-sm text-[var(--fg-subtle)] text-center py-6">
                No merge fields found in this label.<br />
                Add <code className="bg-[var(--bg-subtle)] px-1 rounded text-xs">{'{{field_name}}'}</code> to a text element first.
              </p>
            ) : (
              fields.map(field => {
                const type = guessInputType(field)
                const label = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                return (
                  <div key={field}>
                    <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">
                      {label}
                      <span className="ml-1 text-[var(--fg-subtle)] font-normal">{'{{' + field + '}}'}</span>
                    </label>
                    <input
                      type={type}
                      value={values[field]}
                      onChange={e => set(field, e.target.value)}
                      placeholder={type === 'date' ? 'YYYY-MM-DD' : `Enter ${label.toLowerCase()}…`}
                      className="w-full text-sm border border-[var(--border)] rounded-xl px-3 py-2 bg-[var(--bg-subtle)] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[var(--border)] flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={fields.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
