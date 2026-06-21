'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Tag, Clock, Database, Key, LogOut, Settings, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import ThemeToggle from '@/components/ui/ThemeToggle'

const nav = [
  { href: '/dashboard',    label: 'My Labels',     icon: LayoutDashboard },
  { href: '/templates',    label: 'Templates',      icon: Tag },
  { href: '/history',      label: 'Print History',  icon: Clock },
  { href: '/data',         label: 'Data Sources',   icon: Database },
  { href: '/settings/api', label: 'API Keys',       icon: Key },
  { href: '/settings',     label: 'Settings',       icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)

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
    <>
      {/* Fixed top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border)] backdrop-blur-sm">
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(p => !p)}
          className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          {open ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold text-blue-600 tracking-tight">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">LF</span>
          </div>
          LabelForge
        </Link>
        <div className="ml-auto">
          <ThemeToggle compact />
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px]" onClick={() => setOpen(false)} aria-hidden />
      )}

      {/* Drawer */}
      <nav
        aria-label="Mobile navigation"
        className={cn(
          'fixed top-0 left-0 bottom-0 z-40 w-64 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">LF</span>
          </div>
          <Link href="/dashboard" className="text-[15px] font-bold text-[var(--fg)] tracking-tight" onClick={() => setOpen(false)}>
            LabelForge
          </Link>
        </div>

        <div className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive(href)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]',
              )}
              aria-current={isActive(href) ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              {label}
            </Link>
          ))}
        </div>

        <div className="px-3 py-3 border-t border-[var(--border)] space-y-2">
          <div className="px-1">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--danger)] transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden />
            Sign out
          </button>
        </div>
      </nav>
    </>
  )
}
