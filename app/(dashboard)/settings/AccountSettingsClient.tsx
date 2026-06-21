'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { updateDisplayName, changePassword, deleteAccount } from '@/actions/account'
import { toast } from '@/lib/store/toasts'

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8)              score++
  if (pw.length >= 12)             score++
  if (/[A-Z]/.test(pw))            score++
  if (/[0-9]/.test(pw))            score++
  if (/[^A-Za-z0-9]/.test(pw))    score++
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500']
  return { score, label: labels[score] ?? 'Very weak', color: colors[score] ?? 'bg-red-500' }
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <h2 className="text-sm font-semibold text-[var(--fg)]">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

const inputCls = 'w-full px-3.5 py-2.5 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow'
const btnPrimary = 'px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm'

export default function AccountSettingsClient({
  email,
  displayName: initialName,
}: {
  email: string
  displayName: string
}) {
  // Profile
  const [name, setName]             = useState(initialName)
  const [namePending, startName]    = useTransition()

  // Password
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [pwPending, startPw]        = useTransition()

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletePending, startDelete]      = useTransition()

  const pwStrength  = passwordStrength(newPw)
  const pwMismatch  = confirmPw && confirmPw !== newPw

  function handleNameSave(e: React.FormEvent) {
    e.preventDefault()
    startName(async () => {
      try {
        await updateDisplayName(name)
        toast.success('Display name updated')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update name')
      }
    })
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    startPw(async () => {
      try {
        await changePassword(currentPw, newPw)
        toast.success('Password changed successfully')
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to change password')
      }
    })
  }

  function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault()
    if (deleteConfirm !== 'DELETE') return
    startDelete(async () => {
      try {
        await deleteAccount()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete account')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile */}
      <Card title="Profile">
        <form onSubmit={handleNameSave} className="space-y-4">
          <div>
            <label htmlFor="display-name" className="block text-sm font-medium text-[var(--fg)] mb-1.5">
              Display name
            </label>
            <input
              id="display-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              className={`${inputCls} max-w-sm`}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--fg)] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className={`${inputCls} max-w-sm opacity-60 cursor-not-allowed`}
              aria-label="Email address (read-only)"
            />
            <p className="text-xs text-[var(--fg-subtle)] mt-1">Email changes are managed through Supabase.</p>
          </div>
          <button type="submit" disabled={namePending || !name.trim()} className={btnPrimary}>
            {namePending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </Card>

      {/* Password */}
      <Card title="Change Password">
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
          <div>
            <label htmlFor="current-pw" className="block text-sm font-medium text-[var(--fg)] mb-1.5">Current password</label>
            <input
              id="current-pw"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="new-pw" className="block text-sm font-medium text-[var(--fg)] mb-1.5">New password</label>
            <div className="relative">
              <input
                id="new-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className={`${inputCls} pr-11`}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                aria-label={showPw ? 'Hide passwords' : 'Show passwords'}
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
              </button>
            </div>
            {newPw && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrength.score ? pwStrength.color : 'bg-[var(--border)]'}`} />
                  ))}
                </div>
                <p className="text-xs text-[var(--fg-muted)]">{pwStrength.label}</p>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="confirm-pw" className="block text-sm font-medium text-[var(--fg)] mb-1.5">Confirm new password</label>
            <input
              id="confirm-pw"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className={`${inputCls} ${pwMismatch ? 'border-red-400 dark:border-red-700' : ''}`}
            />
            {pwMismatch && <p className="text-xs text-red-500 dark:text-red-400 mt-1">Passwords don&apos;t match</p>}
          </div>
          <button
            type="submit"
            disabled={pwPending || !currentPw || !newPw || !confirmPw || !!pwMismatch}
            className={btnPrimary}
          >
            {pwPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </Card>

      {/* Danger zone */}
      <Card title="Danger Zone">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Delete account</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                Permanently deletes your account and all data — labels, print history, API keys, and data sources.
                This action cannot be undone.
              </p>
            </div>
          </div>
          <form onSubmit={handleDeleteAccount} className="space-y-3 max-w-sm">
            <div>
              <label htmlFor="delete-confirm" className="block text-sm font-medium text-[var(--fg)] mb-1.5">
                Type <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETE</span> to confirm
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                className={inputCls}
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={deletePending || deleteConfirm !== 'DELETE'}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {deletePending ? 'Deleting…' : 'Delete my account'}
            </button>
          </form>
        </div>
      </Card>
    </div>
  )
}
