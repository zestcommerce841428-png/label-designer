'use client'

import { useState, useMemo } from 'react'
import { Search, FileText, LayoutGrid } from 'lucide-react'
import LabelCard from './LabelCard'
import { deleteLabel, duplicateLabel, renameLabel } from '@/actions/labels'
import Link from 'next/link'

type Label = {
  id: string
  name: string
  size_config: { width: number; height: number }
  thumbnail: string | null
  updated_at: string
}

export default function LabelGrid({ labels }: { labels: Label[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return labels
    return labels.filter(l => l.name.toLowerCase().includes(q))
  }, [labels, query])

  return (
    <div className="space-y-4">
      {/* Search + count bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-subtle)] pointer-events-none" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search labels…"
            aria-label="Search labels"
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-card)] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] transition-shadow"
          />
        </div>
        {labels.length > 0 && (
          <p className="text-xs text-[var(--fg-subtle)] shrink-0">
            {query ? `${filtered.length} of ${labels.length}` : `${labels.length}`} label{labels.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          {query ? (
            <>
              <Search className="w-10 h-10 text-[var(--fg-subtle)] mb-3" aria-hidden />
              <p className="text-sm font-medium text-[var(--fg-muted)]">No labels match &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-[var(--fg-subtle)]" aria-hidden />
              </div>
              <h2 className="text-base font-semibold text-[var(--fg)] mb-1">No labels yet</h2>
              <p className="text-sm text-[var(--fg-muted)] mb-5">Create a blank label or start from a template</p>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
              >
                <LayoutGrid className="w-4 h-4" aria-hidden />
                Browse Templates
              </Link>
            </>
          )}
        </div>
      )}

      {/* Label grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(label => (
            <LabelCard
              key={label.id}
              label={label}
              onDelete={deleteLabel}
              onDuplicate={duplicateLabel}
              onRename={renameLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
