'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8)           score++
  if (pw.length >= 12)          score++
  if (/[A-Z]/.test(pw))         score++
  if (/[0-9]/.test(pw))         score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500']
  return { score, label: labels[score] ?? 'Very weak', color: colors[score] ?? 'bg-red-500' }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState('')
  const [isPending, start]        = useTransition()

  const strength = passwordStrength(password)
  const mismatch = confirm && confirm !== password

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setError('')
    start(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
      } else {
        setDone(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    })
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-subtle)] px-4">
        <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-[var(--fg)] mb-2">Password updated</h1>
          <p className="text-sm text-[var(--fg-muted)]">Redirecting to your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-subtle)]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 bg-gradient-to-br from-emerald-600 to-teal-700 flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-bold">LF</span>
          </div>
          <span className="text-white text-lg font-bold tracking-tight">LabelForge</span>
        </Link>
        <div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
            <ShieldCheck className="w-7 h-7 text-white" aria-hidden />
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">Set a new password</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Choose something strong — at least 8 characters with a mix of uppercase, numbers, and symbols.
          </p>
        </div>
        <p className="text-white/40 text-xs">Your new password takes effect immediately.</p>
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
          <div className="ml-auto">
            <ThemeToggle compact />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              </div>
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Set new password</h1>
              <p className="text-sm text-[var(--fg-muted)] mt-1">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--fg)] mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    autoFocus
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Min. 8 characters"
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
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1" aria-label={`Password strength: ${strength.label}`}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-[var(--border)]'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-[var(--fg-muted)]">{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-[var(--fg)] mb-1.5">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-[var(--bg-card)] border rounded-xl text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${mismatch ? 'border-red-400 dark:border-red-700' : 'border-[var(--border)]'}`}
                  placeholder="Re-enter password"
                />
                {mismatch && <p className="text-xs text-red-500 dark:text-red-400 mt-1">Passwords don't match</p>}
              </div>

              {error && (
                <div role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || !password || !confirm || !!mismatch}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
              >
                {isPending ? 'Updating…' : (<>Update password <ArrowRight className="w-4 h-4" aria-hidden /></>)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
