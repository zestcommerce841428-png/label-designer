import { createClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { deleteLabel, duplicateLabel } from '@/actions/labels'
import LabelCard from './LabelCard'

export default async function LabelList() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: labels } = await supabase
    .from('labels')
    .select('id, name, size_config, thumbnail, updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  if (!labels || labels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FileText className="w-12 h-12 text-zinc-300 mb-4" />
        <h2 className="text-lg font-semibold text-zinc-600 mb-1">No labels yet</h2>
        <p className="text-zinc-400 text-sm mb-6">Create a blank label or start from a template</p>
        <div className="flex gap-3">
          <a href="/templates" className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors">
            Browse Templates
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {labels.map(label => (
        <LabelCard
          key={label.id}
          label={label}
          onDelete={deleteLabel}
          onDuplicate={duplicateLabel}
        />
      ))}
    </div>
  )
}
