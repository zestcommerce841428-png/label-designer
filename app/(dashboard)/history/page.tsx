import { Suspense } from 'react'
import { Printer } from 'lucide-react'
import PrintHistory from './PrintHistory'

export default function HistoryPage() {
  return (
    <div className="px-4 py-6 sm:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Print History</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Recent print jobs</p>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center py-24"><Printer className="w-8 h-8 text-zinc-300 animate-pulse" /></div>}>
        <PrintHistory />
      </Suspense>
    </div>
  )
}
