import { Suspense } from 'react'
import { Database } from 'lucide-react'
import DataSourcesList from './DataSourcesList'

export default function DataPage() {
  return (
    <div className="px-4 py-6 sm:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Data Sources</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          Saved data connections — import once, reuse across print runs.
        </p>
      </div>
      <Suspense fallback={
        <div className="flex items-center justify-center py-24">
          <Database className="w-8 h-8 text-zinc-300 animate-pulse" />
        </div>
      }>
        <DataSourcesList />
      </Suspense>
    </div>
  )
}
