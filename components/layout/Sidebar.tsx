'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Tag, Clock, Database, Key, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'My Labels', icon: LayoutDashboard },
  { href: '/templates', label: 'Templates', icon: Tag },
  { href: '/history', label: 'Print History', icon: Clock },
  { href: '/data', label: 'Data Sources', icon: Database },
  { href: '/settings/api', label: 'API Keys', icon: Key },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 flex flex-col bg-white border-r border-zinc-200 shrink-0">
      <div className="px-5 py-5 border-b border-zinc-100">
        <span className="text-lg font-bold text-blue-600 tracking-tight">LabelForge</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? 'bg-blue-50 text-blue-700'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-zinc-100">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
