import type { Canvas } from 'fabric'
import { useEditorStore } from '@/lib/store/editor'

/** Capture current canvas state into undo history */
export function snapshot(canvas: Canvas): void {
  const json = JSON.stringify(canvas.toObject(['customData', 'id']))
  useEditorStore.getState().pushHistory(json)
  useEditorStore.getState().clearRedo()
}

/** Undo the last operation */
export function undo(canvas: Canvas): void {
  const store = useEditorStore.getState()
  if (store.historyStack.length < 2) return

  const current = store.popHistory()!
  store.pushRedo(current)

  const prev = store.peekHistory()
  if (!prev) return

  canvas.loadFromJSON(JSON.parse(prev)).then(() => canvas.renderAll())
}

/** Redo the last undone operation */
export function redo(canvas: Canvas): void {
  const store = useEditorStore.getState()
  const next = store.popRedo()
  if (!next) return

  store.pushHistory(next)
  canvas.loadFromJSON(JSON.parse(next)).then(() => canvas.renderAll())
}
