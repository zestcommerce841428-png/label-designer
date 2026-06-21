'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

export default function SignupPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [isPending, start]      = useTransition()
  const strength = passwordStrength(password)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError('')
    start(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-subtle)] px-4">
        <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border)] p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" aria-hidden />
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">Check your email</h2>
          <p className="text-sm text-[var(--fg-muted)]">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-subtle)]">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] shrink-0 bg-gradient-to-br from-violet-600 to-blue-600 flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-bold">LF</span>
          </div>
          <span className="text-white text-lg font-bold tracking-tight">LabelForge</span>
        </Link>
        <div>
          <ul className="space-y-3 text-white/80 text-sm">
            {['95 barcode types including QR, EAN, DataMatrix', 'Import CSV / Excel / Google Sheets data', 'Batch print hundreds of unique labels', 'Export ZPL, TSPL, EPL for thermal printers', 'No software to install — works in any browser'].map(f => (
              <li key={f} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-300 shrink-0" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-white/40 text-xs">Free plan · No credit card required</p>
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
            <Link href="/login" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
              Already have an account? <span className="text-blue-600 font-medium">Sign in</span>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Create your account</h1>
              <p className="text-sm text-[var(--fg-muted)] mt-1">Free forever. No credit card required.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--fg)] mb-1.5">Email address</label>
                <input
                  id="email" type="email" required autoComplete="email" autoFocus
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--fg)] mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="password" type={showPw ? 'text' : 'password'} required autoComplete="new-password" minLength={8}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-11 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                    placeholder="Min. 8 characters"
                  />
                  <button type="button" aria-label={showPw ? 'Hide' : 'Show'} onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors">
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

              {error && (
                <div role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isPending || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md">
                {isPending ? 'Creating account…' : (<>Create free account <ArrowRight className="w-4 h-4" aria-hidden /></>)}
              </button>

              <p className="text-xs text-[var(--fg-subtle)] text-center">By signing up you agree to our terms of service.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
