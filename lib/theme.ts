'use client'

export type Theme = 'light' | 'dark' | 'system'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('lf-theme') as Theme) ?? 'system'
}

export function setTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    localStorage.setItem('lf-theme', 'dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
    localStorage.setItem('lf-theme', 'light')
  } else {
    localStorage.removeItem('lf-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark')
  setTheme(isDark ? 'light' : 'dark')
}
