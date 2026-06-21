'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [isPending, start]      = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    start(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-subtle)]">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 bg-gradient-to-br from-blue-600 to-violet-700 flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-bold">LF</span>
          </div>
          <span className="text-white text-lg font-bold tracking-tight">LabelForge</span>
        </Link>
        <div>
          <blockquote className="text-white/90 text-xl font-medium leading-relaxed mb-4">
            &ldquo;Design once, print thousands.&rdquo;
          </blockquote>
          <p className="text-white/60 text-sm">
            The professional label designer that runs in your browser — no installs, no limits.
          </p>
        </div>
        <div className="flex gap-6 text-white/50 text-xs">
          <span>95 barcode types</span>
          <span>CSV / Excel import</span>
          <span>Batch printing</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" className="lg:hidden flex items-center gap-2 text-blue-600 font-bold">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">LF</span>
            </div>
            LabelForge
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle compact />
            <Link href="/signup" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
              No account? <span className="text-blue-600 font-medium">Sign up</span>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Welcome back</h1>
              <p className="text-sm text-[var(--fg-muted)] mt-1">Sign in to your LabelForge account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--fg)] mb-1.5">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--fg)]">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-500 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                {isPending ? 'Signing in…' : (
                  <>Sign in <ArrowRight className="w-4 h-4" aria-hidden /></>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--fg-muted)]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 font-medium hover:text-blue-500 transition-colors">
                Create one free →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
