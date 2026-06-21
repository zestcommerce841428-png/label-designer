'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8)   score++
  if (pw.length >= 12)  score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" aria-hidden />
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Password updated</h1>
          <p className="text-sm text-zinc-500">Redirecting to your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Set new password</h1>
          <p className="text-sm text-zinc-500 mt-1">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                title={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                {showPw ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
              </button>
            </div>
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-zinc-200'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-500">{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700 mb-1">
              Confirm password
            </label>
            <input
              id="confirm"
              type={showPw ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${mismatch ? 'border-red-400' : 'border-zinc-300'}`}
              placeholder="Re-enter password"
            />
            {mismatch && <p className="text-xs text-red-500 mt-1">Passwords don't match</p>}
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending || !password || !confirm || !!mismatch}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
