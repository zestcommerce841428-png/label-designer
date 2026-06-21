import { createClient } from '@/lib/supabase/server'
import { Printer } from 'lucide-react'
import ExportCsvButton from '@/components/history/ExportCsvButton'

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
        <Printer className="w-12 h-12 text-zinc-300 mb-4" />
        <p className="text-zinc-400 text-sm">No print jobs yet. Print a label to see history.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportCsvButton jobs={jobs} />
      </div>
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Label</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Records</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{job.label_name}</td>
                <td className="px-4 py-3 text-zinc-600">{job.record_count}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    job.status === 'done' ? 'bg-green-50 text-green-700' :
                    job.status === 'failed' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(job.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {job.label_id && (
                    <a href={`/editor/${job.label_id}`} className="text-blue-600 text-xs hover:underline">
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
