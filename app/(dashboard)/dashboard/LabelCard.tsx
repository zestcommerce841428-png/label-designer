'use client'

import Link from 'next/link'
import { MoreVertical, Edit3, Copy, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'

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
}

export default function LabelCard({ label, onDelete, onDuplicate }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="group bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all">
      <Link href={`/editor/${label.id}`}>
        <div className="h-32 bg-zinc-50 flex items-center justify-center border-b border-zinc-100 overflow-hidden">
          {label.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={label.thumbnail}
              alt={label.name}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="bg-white border border-zinc-200 shadow-sm rounded-sm w-24 h-16 flex items-center justify-center text-xs text-zinc-300">
              {label.size_config.width}×{label.size_config.height}
            </div>
          )}
        </div>
      </Link>

      <div className="p-3 flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <Link href={`/editor/${label.id}`}>
            <p className="text-sm font-medium text-zinc-900 truncate hover:text-blue-600 transition-colors">{label.name}</p>
          </Link>
          <p className="text-xs text-zinc-400 mt-0.5">
            {new Date(label.updated_at).toLocaleDateString()}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setOpen(p => !p)}
            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {open && (
            <div className="absolute right-0 top-7 z-10 w-36 bg-white rounded-lg shadow-lg border border-zinc-200 py-1">
              <Link
                href={`/editor/${label.id}`}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                onClick={() => setOpen(false)}
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </Link>
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                onClick={() => { setOpen(false); startTransition(() => onDuplicate(label.id)) }}
              >
                <Copy className="w-3.5 h-3.5" /> Duplicate
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  setOpen(false)
                  if (confirm('Delete this label?')) startTransition(() => onDelete(label.id))
                }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
