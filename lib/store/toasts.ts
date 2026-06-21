import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type Toast = {
  id: string
  type: ToastType
  message: string
  /** ms until auto-dismiss. 0 = manual dismiss only. Default 4000. */
  duration: number
}

type ToastStore = {
  toasts: Toast[]
  add: (t: Omit<Toast, 'id'>) => string
  remove: (id: string) => void
  clear: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  add: (t) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set(s => ({ toasts: [...s.toasts, { ...t, id }] }))

    if (t.duration !== 0) {
      setTimeout(() => {
        set(s => ({ toasts: s.toasts.filter(x => x.id !== id) }))
      }, t.duration ?? 4000)
    }
    return id
  },

  remove: (id) => set(s => ({ toasts: s.toasts.filter(x => x.id !== id) })),

  clear: () => set({ toasts: [] }),
}))

// ── Convenience helpers ───────────────────────────────────────────────────────

function add(message: string, type: ToastType, duration = 4000) {
  return useToastStore.getState().add({ message, type, duration })
}

export const toast = {
  success: (msg: string, duration?: number) => add(msg, 'success', duration),
  error:   (msg: string, duration?: number) => add(msg, 'error',   duration ?? 6000),
  info:    (msg: string, duration?: number) => add(msg, 'info',    duration),
  warning: (msg: string, duration?: number) => add(msg, 'warning', duration),
}
