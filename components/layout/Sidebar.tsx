'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Tag, Clock, Database, Key, LogOut, Settings, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard',    label: 'My Labels',     icon: LayoutDashboard },
  { href: '/templates',    label: 'Templates',     icon: Tag },
  { href: '/history',      label: 'Print History', icon: Clock },
  { href: '/data',         label: 'Data Sources',  icon: Database },
]

const bottomNav = [
  { href: '/settings/api', label: 'API Keys',  icon: Key },
  { href: '/settings',     label: 'Settings',  icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-56 flex flex-col bg-white border-r border-zinc-200 shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-100">
        <Link href="/dashboard" className="text-lg font-bold text-blue-600 tracking-tight hover:text-blue-700 transition-colors">
          LabelForge
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
            )}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom nav + sign out */}
      <div className="px-3 py-3 border-t border-zinc-100 space-y-0.5">
        {bottomNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-blue-50 text-blue-700'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
            )}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  )
}
