'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const [isPending, start]    = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    start(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError(error.message)
      else setSent(true)
    })
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-subtle)] px-4">
        <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-[var(--fg)] mb-2">Check your email</h1>
          <p className="text-sm text-[var(--fg-muted)] mb-6">
            We sent a reset link to <strong className="text-[var(--fg)]">{email}</strong>. The link expires in 1 hour.
          </p>
          <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-subtle)]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 bg-gradient-to-br from-sky-600 to-blue-700 flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-bold">LF</span>
          </div>
          <span className="text-white text-lg font-bold tracking-tight">LabelForge</span>
        </Link>
        <div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
            <Mail className="w-7 h-7 text-white" aria-hidden />
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">Forgot your password?</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            No worries — enter your email and we&apos;ll send you a secure link to reset it.
          </p>
        </div>
        <p className="text-white/40 text-xs">Reset links expire after 1 hour for your security.</p>
      </div>

      {/* Right form panel */}
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
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden /> Back to sign in
            </Link>

            <div className="mb-8">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden />
              </div>
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Reset password</h1>
              <p className="text-sm text-[var(--fg-muted)] mt-1">
                Enter your email and we&apos;ll send you a reset link.
              </p>
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

              {error && (
                <div role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !email}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                {isPending ? 'Sending…' : (<>Send reset link <ArrowRight className="w-4 h-4" aria-hidden /></>)}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--fg-muted)]">
              Remember your password?{' '}
              <Link href="/login" className="text-blue-600 font-medium hover:text-blue-500 transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
