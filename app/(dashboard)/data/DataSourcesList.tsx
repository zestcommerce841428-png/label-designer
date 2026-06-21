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
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center mb-4">
            <Database className="w-6 h-6 text-[var(--fg-subtle)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--fg)] mb-1">No saved data sources yet</p>
          <p className="text-xs text-[var(--fg-muted)] max-w-sm leading-relaxed">
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
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Columns</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider text-left">Label</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {sources.map(src => {
              const Icon = TYPE_ICONS[src.type] ?? Database
              const cols: string[] = Array.isArray(src.columns) ? src.columns : []
              return (
                <tr key={src.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-4 py-3 font-medium text-[var(--fg)]">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[var(--fg-subtle)] shrink-0" />
                      {src.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border)]">
                      {TYPE_LABELS[src.type] ?? src.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-subtle)] text-xs">
                    {cols.length > 0
                      ? cols.slice(0, 4).join(', ') + (cols.length > 4 ? ` +${cols.length - 4}` : '')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-subtle)] text-xs">
                    {new Date(src.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {src.label_id ? (
                      <Link href={`/editor/${src.label_id}`} className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-medium">
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
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
      <h2 className="text-sm font-semibold text-[var(--fg)]">How data sources work</h2>
      <div className="grid grid-cols-1 gap-4 text-xs text-[var(--fg-muted)]">
        <Step n={1} title="Import data in the editor">
          Open any label, click <strong className="text-[var(--fg)]">Data</strong> in the toolbar, and import a CSV, Excel file,
          or paste a Google Sheets URL.
        </Step>
        <Step n={2} title="Add merge tags">
          Click any column tag (e.g. <code className="bg-[var(--bg-subtle)] text-[var(--fg-muted)] px-1 rounded border border-[var(--border)]">{'{{name}}'}</code>) to
          copy it, then paste into a text or barcode element on your canvas.
        </Step>
        <Step n={3} title="Batch print">
          Click <strong className="text-[var(--fg)]">Batch</strong> in the editor header to render one label per row and open the
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
        <p className="font-semibold text-[var(--fg)]">{title}</p>
        <p className="mt-0.5">{children}</p>
      </div>
    </div>
  )
}
