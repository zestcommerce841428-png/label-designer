import { createClient } from '@/lib/supabase/server'
import { Database, Sheet, FileText } from 'lucide-react'
import Link from 'next/link'

const TYPE_ICONS: Record<string, React.ElementType> = {
  csv: FileText,
  excel: FileText,
  json: FileText,
  google_sheets: Sheet,
  manual: Database,
}

const TYPE_LABELS: Record<string, string> = {
  csv: 'CSV File',
  excel: 'Excel',
  json: 'JSON',
  google_sheets: 'Google Sheets',
  manual: 'Manual',
}

export default async function DataSourcesList() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sources } = await supabase
    .from('data_sources')
    .select('id, name, type, label_id, created_at, columns')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  if (!sources || sources.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-8 flex flex-col items-center text-center">
          <Database className="w-10 h-10 text-zinc-300 mb-3" />
          <p className="text-zinc-500 text-sm font-medium">No saved data sources yet.</p>
          <p className="text-zinc-400 text-xs mt-1 max-w-sm">
            Open a label in the editor, click <strong>Data</strong>, then import a CSV, Excel, or
            Google Sheet. Your connection will appear here automatically.
          </p>
        </div>
        <HowItWorks />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Columns</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-left">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sources.map(src => {
              const Icon = TYPE_ICONS[src.type] ?? Database
              const cols: string[] = Array.isArray(src.columns) ? src.columns : []
              return (
                <tr key={src.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                    {src.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                      {TYPE_LABELS[src.type] ?? src.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {cols.length > 0
                      ? cols.slice(0, 4).join(', ') + (cols.length > 4 ? ` +${cols.length - 4}` : '')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(src.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {src.label_id ? (
                      <Link href={`/editor/${src.label_id}`} className="text-blue-600 text-xs hover:underline">
                        Open editor →
                      </Link>
                    ) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <HowItWorks />
    </div>
  )
}

function HowItWorks() {
  return (
    <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-900">How data sources work</h2>
      <div className="grid grid-cols-1 gap-3 text-xs text-zinc-600">
        <Step n={1} title="Import data in the editor">
          Open any label, click <strong>Data</strong> in the toolbar, and import a CSV, Excel file,
          or paste a Google Sheets URL.
        </Step>
        <Step n={2} title="Add merge tags">
          Click any column tag (e.g. <code className="bg-zinc-100 px-1 rounded">{'{{name}}'}</code>) to
          copy it, then paste into a text or barcode element on your canvas.
        </Step>
        <Step n={3} title="Batch print">
          Click <strong>Batch</strong> in the editor header to render one label per row and open the
          browser print dialog.
        </Step>
      </div>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <div>
        <p className="font-medium text-zinc-900">{title}</p>
        <p className="mt-0.5 text-zinc-500">{children}</p>
      </div>
    </div>
  )
}
