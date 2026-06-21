import { createClient } from '@/lib/supabase/server'
import { Printer } from 'lucide-react'
import ExportButtons from '@/components/history/ExportCsvButton'

export default async function PrintHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: jobs } = await supabase
    .from('print_jobs')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (!jobs || jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center mb-4">
          <Printer className="w-7 h-7 text-[var(--fg-subtle)]" />
        </div>
        <p className="text-sm font-medium text-[var(--fg-muted)]">No print jobs yet</p>
        <p className="text-xs text-[var(--fg-subtle)] mt-1">Print a label to see its history here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--fg-muted)]">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</p>
        <ExportButtons jobs={jobs} />
      </div>
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Label</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Records</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--fg)]">{job.label_name}</td>
                <td className="px-4 py-3 text-[var(--fg-muted)]">{job.record_count}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.status === 'done'
                      ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                      : job.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                        : 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--fg-subtle)]">
                  {new Date(job.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {job.label_id && (
                    <a href={`/editor/${job.label_id}`} className="text-blue-600 dark:text-blue-400 text-xs hover:underline font-medium">
                      Reopen →
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
