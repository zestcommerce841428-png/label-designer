'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { type Template } from '@/lib/templates'
import { createClient } from '@/lib/supabase/client'

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
          size_config: { width: template.size.width, height: template.size.height, unit: 'mm' },
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search templates…"
            aria-label="Search templates"
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...categories].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-zinc-600">No templates match your search</p>
          <button type="button" onClick={() => { setQuery(''); setActiveCategory('All') }}
            className="mt-2 text-sm text-blue-600 hover:underline">
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
              className="group bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="h-32 bg-zinc-50 flex items-center justify-center border-b border-zinc-100">
                <div className="bg-white border border-zinc-200 shadow-sm rounded-sm w-24 h-14 flex items-center justify-center text-xs text-zinc-300">
                  {template.size.width}×{template.size.height}
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-zinc-900 truncate">{template.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{template.category}</p>
                <button
                  type="button"
                  onClick={() => useTemplate(template)}
                  disabled={isPending && loadingId === template.id}
                  className="mt-2 w-full py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isPending && loadingId === template.id ? 'Opening…' : 'Use Template'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {query && filtered.length > 0 && (
        <p className="text-xs text-zinc-400 mt-4">
          {filtered.length} of {templates.length} template{templates.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
