'use client'

import { useToastStore } from '@/lib/store/toasts'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

const CONFIG = {
  success: { icon: CheckCircle2, bar: 'bg-green-500',  bg: 'bg-white',  text: 'text-zinc-900', border: 'border-green-200' },
  error:   { icon: AlertCircle,  bar: 'bg-red-500',    bg: 'bg-white',  text: 'text-zinc-900', border: 'border-red-200'   },
  warning: { icon: AlertTriangle,bar: 'bg-amber-500',  bg: 'bg-white',  text: 'text-zinc-900', border: 'border-amber-200' },
  info:    { icon: Info,         bar: 'bg-blue-500',   bg: 'bg-white',  text: 'text-zinc-900', border: 'border-blue-200'  },
}

const ICON_COLOR = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-blue-500',
}

export default function Toaster() {
  const { toasts, remove } = useToastStore()

  if (!toasts.length) return null

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map(t => {
        const c = CONFIG[t.type]
        const Icon = c.icon

        return (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start gap-3 w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border ${c.border} ${c.bg} shadow-lg overflow-hidden pointer-events-auto`}
          >
            {/* Accent bar */}
            <div className={`w-1 shrink-0 self-stretch ${c.bar}`} aria-hidden />

            <Icon className={`w-4 h-4 mt-3 shrink-0 ${ICON_COLOR[t.type]}`} aria-hidden />

            <span className={`flex-1 text-sm py-3 pr-1 leading-snug ${c.text}`}>
              {t.message}
            </span>

            <button
              type="button"
              title="Dismiss notification"
              aria-label="Dismiss"
              onClick={() => remove(t.id)}
              className="mt-2.5 mr-2.5 p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        )
      })}
    </div>
  )
}
