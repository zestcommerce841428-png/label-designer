'use client'

import { useState, useMemo } from 'react'
import { Search, FileText } from 'lucide-react'
import LabelCard from './LabelCard'
import { deleteLabel, duplicateLabel } from '@/actions/labels'

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
      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search labels…"
          aria-label="Search labels"
          className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-10 h-10 text-zinc-300 mb-3" aria-hidden />
          {query ? (
            <>
              <p className="text-sm font-medium text-zinc-600">No labels match "{query}"</p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-zinc-600 mb-1">No labels yet</h2>
              <p className="text-zinc-400 text-sm mb-4">Create a blank label or start from a template</p>
              <a
                href="/templates"
                className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors"
              >
                Browse Templates
              </a>
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
            />
          ))}
        </div>
      )}

      {/* Result count when searching */}
      {query && filtered.length > 0 && (
        <p className="text-xs text-zinc-400">
          {filtered.length} of {labels.length} label{labels.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
