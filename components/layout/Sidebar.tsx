'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Tag, Clock, Database, Key, LogOut, Settings, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useEffect, useState } from 'react'

const nav = [
  { href: '/dashboard',  label: 'My Labels',     icon: LayoutDashboard },
  { href: '/templates',  label: 'Templates',      icon: Tag },
  { href: '/history',    label: 'Print History',  icon: Clock },
  { href: '/data',       label: 'Data Sources',   icon: Database },
]

const bottomNav = [
  { href: '/settings/api', label: 'API Keys',  icon: Key },
  { href: '/settings',     label: 'Settings',  icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null)
      setDisplayName(
        user?.user_metadata?.display_name ??
        user?.user_metadata?.full_name ??
        user?.email?.split('@')[0] ??
        null
      )
    })
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside className="w-60 flex flex-col h-full bg-[var(--bg-card)] border-r border-[var(--border)] shrink-0">

      {/* Brand */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">LF</span>
          </div>
          <span className="text-[15px] font-bold text-[var(--fg)] group-hover:text-blue-600 transition-colors tracking-tight">
            LabelForge
          </span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" aria-hidden />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-3 space-y-1 border-t border-[var(--border)] pt-3">

        {/* Theme toggle */}
        <div className="px-1 pb-2">
          <ThemeToggle />
        </div>

        {bottomNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
              isActive(href)
                ? 'bg-[var(--bg-subtle)] text-[var(--fg)]'
                : 'text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]',
            )}
            aria-current={isActive(href) ? 'page' : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}

        {/* User row */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--fg)] truncate">{displayName ?? 'Account'}</p>
            <p className="text-[10px] text-[var(--fg-subtle)] truncate">{userEmail ?? ''}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            className="p-1 rounded-lg text-[var(--fg-subtle)] hover:text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  )
}
