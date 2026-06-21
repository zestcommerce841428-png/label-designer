'use client'

import Link from 'next/link'
import { MoreVertical, Edit3, Copy, Trash2, Pencil, Check, X } from 'lucide-react'
import { useState, useTransition, useRef, useEffect } from 'react'

type Label = {
  id: string
  name: string
  size_config: { width: number; height: number }
  thumbnail: string | null
  updated_at: string
}

type Props = {
  label: Label
  onDelete: (id: string) => Promise<void>
  onDuplicate: (id: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
}

export default function LabelCard({ label, onDelete, onDuplicate, onRename }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [renaming, setRenaming] = useState(false)
  const [draftName, setDraftName] = useState(label.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (renaming) inputRef.current?.select()
  }, [renaming])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function commitRename() {
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== label.name) {
      startTransition(() => onRename(label.id, trimmed))
    }
    setRenaming(false)
  }

  function cancelRename() {
    setDraftName(label.name)
    setRenaming(false)
  }

  return (
    <div className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg dark:hover:shadow-black/30 transition-all duration-200">
      <Link href={`/editor/${label.id}`} tabIndex={-1}>
        <div className="h-32 bg-[var(--bg-subtle)] flex items-center justify-center border-b border-[var(--border)] overflow-hidden relative">
          {label.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={label.thumbnail}
              alt={label.name}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] shadow-sm rounded-sm w-24 h-16 flex items-center justify-center text-xs text-[var(--fg-subtle)]">
              {label.size_config.width}×{label.size_config.height}
            </div>
          )}
          <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors" />
        </div>
      </Link>

      <div className="p-3 flex items-start gap-1">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="text"
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') cancelRename()
                }}
                onBlur={commitRename}
                aria-label="Label name"
                className="flex-1 min-w-0 text-sm border border-blue-400 rounded-lg px-1.5 py-0.5 bg-[var(--bg-card)] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                maxLength={100}
              />
              <button type="button" onClick={commitRename} title="Save" className="p-0.5 text-green-600 hover:text-green-500">
                <Check className="w-3.5 h-3.5" aria-hidden />
              </button>
              <button type="button" onClick={cancelRename} title="Cancel" className="p-0.5 text-[var(--fg-subtle)] hover:text-[var(--fg)]">
                <X className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>
          ) : (
            <Link href={`/editor/${label.id}`}>
              <p className="text-sm font-semibold text-[var(--fg)] truncate hover:text-blue-600 transition-colors">{label.name}</p>
            </Link>
          )}
          <p className="text-xs text-[var(--fg-subtle)] mt-0.5">
            {new Date(label.updated_at).toLocaleDateString()}
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(p => !p)}
            aria-label="Label options"
            className="p-1 rounded-lg hover:bg-[var(--bg-subtle)] text-[var(--fg-subtle)] hover:text-[var(--fg)] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {open && (
            <div className="absolute right-0 top-8 z-20 w-40 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border)] py-1 overflow-hidden">
              <Link
                href={`/editor/${label.id}`}
                className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors"
                onClick={() => setOpen(false)}
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden /> Edit
              </Link>
              <button
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors"
                onClick={() => { setOpen(false); setRenaming(true) }}
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden /> Rename
              </button>
              <button
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors"
                onClick={() => { setOpen(false); startTransition(() => onDuplicate(label.id)) }}
                disabled={isPending}
              >
                <Copy className="w-3.5 h-3.5" aria-hidden /> Duplicate
              </button>
              <div className="my-1 border-t border-[var(--border)]" />
              <button
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                onClick={() => {
                  setOpen(false)
                  if (confirm('Delete this label?')) startTransition(() => onDelete(label.id))
                }}
                disabled={isPending}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
