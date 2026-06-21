'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { toggleTheme, getTheme, setTheme, type Theme } from '@/lib/theme'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setLocalTheme] = useState<Theme>('system')

  useEffect(() => {
    setLocalTheme(getTheme())
    // keep in sync if another tab changes it
    const handler = () => setLocalTheme(getTheme())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  function cycle() {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(next)
    setLocalTheme(next)
  }

  if (compact) {
    const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor
    return (
      <button
        type="button"
        onClick={cycle}
        title={`Theme: ${theme}. Click to cycle.`}
        className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors"
      >
        <Icon className="w-4 h-4" aria-hidden />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
      {(['light', 'system', 'dark'] as Theme[]).map(t => {
        const Icon = t === 'dark' ? Moon : t === 'light' ? Sun : Monitor
        const active = theme === t
        return (
          <button
            key={t}
            type="button"
            onClick={() => { setTheme(t); setLocalTheme(t) }}
            title={t.charAt(0).toUpperCase() + t.slice(1)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              active
                ? 'bg-[var(--bg-card)] text-[var(--fg)] shadow-sm'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden />
            <span className="capitalize">{t}</span>
          </button>
        )
      })}
    </div>
  )
}
