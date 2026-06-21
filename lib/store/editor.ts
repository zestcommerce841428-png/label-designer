import { create } from 'zustand'
import { LABEL_SIZES, type LabelSize } from '@/lib/label-sizes'
import { MAX_HISTORY_DEPTH } from '@/lib/constants'

export type DataRow = Record<string, string>

type EditorStore = {
  labelId: string | null
  labelName: string
  selectedSize: LabelSize
  bleedMm: number
  dataRows: DataRow[]
  previewRowIndex: number
  activeObjectId: string | null
  isDirty: boolean

  /** Serialized canvas JSON snapshots for undo */
  historyStack: string[]
  /** Serialized canvas JSON snapshots for redo */
  redoStack: string[]

  setLabelId: (id: string) => void
  setLabelName: (name: string) => void
  setSelectedSize: (size: LabelSize) => void
  setBleedMm: (mm: number) => void
  setDataRows: (rows: DataRow[]) => void
  setPreviewRowIndex: (i: number) => void
  setActiveObjectId: (id: string | null) => void
  setDirty: (dirty: boolean) => void

  pushHistory: (snapshot: string) => void
  popHistory: () => string | undefined
  peekHistory: () => string | undefined
  pushRedo: (snapshot: string) => void
  popRedo: () => string | undefined
  clearRedo: () => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  labelId: null,
  labelName: 'Untitled Label',
  selectedSize: LABEL_SIZES[1], // Avery 5160
  bleedMm: 0,
  dataRows: [],
  previewRowIndex: 0,
  activeObjectId: null,
  isDirty: false,
  historyStack: [],
  redoStack: [],

  setLabelId: (id) => set({ labelId: id }),
  setLabelName: (name) => set({ labelName: name, isDirty: true }),
  setSelectedSize: (size) => set({ selectedSize: size }),
  setBleedMm: (mm) => set({ bleedMm: Math.max(0, mm), isDirty: true }),
  setDataRows: (rows) => set({ dataRows: rows }),
  setPreviewRowIndex: (i) => set({ previewRowIndex: i }),
  setActiveObjectId: (id) => set({ activeObjectId: id }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  pushHistory: (snapshot) => set((s) => {
    const stack = [...s.historyStack, snapshot]
    return { historyStack: stack.length > MAX_HISTORY_DEPTH ? stack.slice(-MAX_HISTORY_DEPTH) : stack }
  }),
  popHistory: () => {
    const { historyStack } = get()
    if (!historyStack.length) return undefined
    const last = historyStack[historyStack.length - 1]
    set({ historyStack: historyStack.slice(0, -1) })
    return last
  },
  peekHistory: () => {
    const { historyStack } = get()
    return historyStack[historyStack.length - 1]
  },
  pushRedo: (snapshot) => set((s) => ({ redoStack: [...s.redoStack, snapshot] })),
  popRedo: () => {
    const { redoStack } = get()
    if (!redoStack.length) return undefined
    const last = redoStack[redoStack.length - 1]
    set({ redoStack: redoStack.slice(0, -1) })
    return last
  },
  clearRedo: () => set({ redoStack: [] }),
}))
