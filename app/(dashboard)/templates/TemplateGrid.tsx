'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import dynamic from 'next/dynamic'
import { type Template } from '@/lib/templates'
import { createClient } from '@/lib/supabase/client'

const TemplateThumbnail = dynamic(() => import('@/components/ui/TemplateThumbnail'), { ssr: false })

type Props = {
  templates: Template[]
  categories: string[]
}

export default function TemplateGrid({ templates, categories }: Props) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = activeCategory === 'All' ? templates : templates.filter(t => t.category === activeCategory)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
    return list
  }, [templates, activeCategory, query])

  function useTemplate(template: Template) {
    setLoadingId(template.id)
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('labels')
        .insert({
          user_id: user.id,
          name: template.name,
          canvas_json: template.canvas_json,
          size_config: {
            width: template.size.width,
            height: template.size.height,
            unit: 'mm',
            sampleData: template.sampleData ?? [],
          },
        })
        .select('id')
        .single()

      if (data) router.push(`/editor/${data.id}`)
      setLoadingId(null)
    })
  }

  return (
    <div>
      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fg-subtle)] pointer-events-none" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search templates…"
            aria-label="Search templates"
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-card)] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] transition-shadow"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-blue-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Search className="w-10 h-10 text-[var(--fg-subtle)] mb-3" aria-hidden />
          <p className="text-sm font-medium text-[var(--fg-muted)]">No templates match your search</p>
          <button type="button" onClick={() => { setQuery(''); setActiveCategory('All') }}
            className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors">
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(template => (
            <div
              key={template.id}
              className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200"
            >
              <div className="h-32 bg-[var(--bg-subtle)] flex items-center justify-center border-b border-[var(--border)] overflow-hidden p-2">
                <TemplateThumbnail
                  canvasJson={template.canvas_json}
                  width={template.size.width}
                  height={template.size.height}
                  className="w-full h-full"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-[var(--fg)] truncate">{template.name}</p>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">{template.category} · {template.size.width}×{template.size.height}mm</p>
                <button
                  type="button"
                  onClick={() => useTemplate(template)}
                  disabled={isPending && loadingId === template.id}
                  className="mt-2.5 w-full py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                >
                  {isPending && loadingId === template.id ? 'Opening…' : 'Use Template'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {query && filtered.length > 0 && (
        <p className="text-xs text-[var(--fg-subtle)] mt-4">
          {filtered.length} of {templates.length} template{templates.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
