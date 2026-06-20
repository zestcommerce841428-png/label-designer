import { Suspense } from 'react'
import { Plus, FileText } from 'lucide-react'
import { createLabel } from '@/actions/labels'
import LabelList from './LabelList'

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Labels</h1>
        </div>
        <form action={createLabel}>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Label
          </button>
        </form>
      </div>
      <Suspense fallback={<LabelListSkeleton />}>
        <LabelList />
      </Suspense>
    </div>
  )
}

function LabelListSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-zinc-200 overflow-hidden animate-pulse">
          <div className="h-32 bg-zinc-100" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-zinc-200 rounded w-3/4" />
            <div className="h-2 bg-zinc-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
