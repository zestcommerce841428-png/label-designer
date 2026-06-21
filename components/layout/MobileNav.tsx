'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Tag, Clock, Database, Key, LogOut, Settings, Menu, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard',    label: 'My Labels',     icon: LayoutDashboard },
  { href: '/templates',    label: 'Templates',     icon: Tag },
  { href: '/history',      label: 'Print History', icon: Clock },
  { href: '/data',         label: 'Data Sources',  icon: Database },
  { href: '/settings/api', label: 'API Keys',      icon: Key },
  { href: '/settings',     label: 'Settings',      icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen]  = useState(false)

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
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-3 bg-white border-b border-zinc-200">
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          title={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(p => !p)}
          className="text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          {open ? <X className="w-5 h-5" aria-hidden /> : <Menu className="w-5 h-5" aria-hidden />}
        </button>
        <Link href="/dashboard" className="text-base font-bold text-blue-600 tracking-tight">
          LabelForge
        </Link>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <nav
        aria-label="Mobile navigation"
        className={cn(
          'fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-200',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-5 py-5 border-b border-zinc-100">
          <Link
            href="/dashboard"
            className="text-lg font-bold text-blue-600 tracking-tight"
            onClick={() => setOpen(false)}
          >
            LabelForge
          </Link>
        </div>

        <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
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
        </div>

        <div className="px-3 py-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden />
            Sign out
          </button>
        </div>
      </nav>
    </>
  )
}
