'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { type Template } from '@/lib/templates'
import { createClient } from '@/lib/supabase/client'

type Props = {
  templates: Template[]
  categories: string[]
}

export default function TemplateGrid({ templates, categories }: Props) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('All')
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = activeCategory === 'All'
    ? templates
    : templates.filter(t => t.category === activeCategory)

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
      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['All', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map(template => (
          <div
            key={template.id}
            className="group bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
          >
            {/* Preview area */}
            <div
              className="h-32 bg-zinc-50 flex items-center justify-center p-3"
              style={{ aspectRatio: `${template.size.width}/${template.size.height}` }}
            >
              <div
                className="bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-xs text-zinc-400"
                style={{
                  width: Math.min(160, template.size.width * 1.5),
                  height: Math.min(128, template.size.height * 1.5),
                  maxWidth: '100%',
                }}
              >
                {template.size.width}×{template.size.height}mm
              </div>
            </div>

            <div className="p-3">
              <p className="text-sm font-medium text-zinc-900 truncate">{template.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{template.category}</p>
              <button
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
    </div>
  )
}
