'use client'

import { Download } from 'lucide-react'

type PrintJob = {
  id: string
  label_name: string
  record_count: number
  status: string
  created_at: string
}

export default function ExportCsvButton({ jobs }: { jobs: PrintJob[] }) {
  function exportCsv() {
    const header = ['Label', 'Records', 'Status', 'Date']
    const rows = jobs.map(j => [
      `"${j.label_name.replace(/"/g, '""')}"`,
      j.record_count,
      j.status,
      new Date(j.created_at).toLocaleString(),
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `print-history-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!jobs.length) return null

  return (
    <button
      type="button"
      onClick={exportCsv}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  )
}
