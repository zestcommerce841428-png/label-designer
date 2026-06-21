import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import { createLabel } from '@/actions/labels'
import { createClient } from '@/lib/supabase/server'
import LabelList from './LabelList'
import Link from 'next/link'

async function DashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: labelCount }, { count: printCount }] = await Promise.all([
    supabase.from('labels').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('print_jobs').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
  ])

  const stats = [
    { label: 'Labels', value: labelCount ?? 0, href: '/dashboard' },
    { label: 'Print jobs', value: printCount ?? 0, href: '/history' },
  ]

  return (
    <div className="flex gap-4 mb-6">
      {stats.map(s => (
        <Link key={s.label} href={s.href}
          className="flex-1 max-w-[140px] bg-white border border-zinc-200 rounded-xl px-4 py-3 hover:border-blue-300 transition-colors">
          <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
        </Link>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="px-4 py-6 sm:p-8">
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
      <Suspense fallback={null}>
        <DashboardStats />
      </Suspense>
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
