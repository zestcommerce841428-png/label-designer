import { create } from 'zustand'
import { LABEL_SIZES, type LabelSize } from '@/lib/label-sizes'

export type DataRow = Record<string, string>

type EditorStore = {
  labelId: string | null
  labelName: string
  selectedSize: LabelSize
  dataRows: DataRow[]
  previewRowIndex: number
  activeObjectId: string | null
  isDirty: boolean

  setLabelId: (id: string) => void
  setLabelName: (name: string) => void
  setSelectedSize: (size: LabelSize) => void
  setDataRows: (rows: DataRow[]) => void
  setPreviewRowIndex: (i: number) => void
  setActiveObjectId: (id: string | null) => void
  setDirty: (dirty: boolean) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  labelId: null,
  labelName: 'Untitled Label',
  selectedSize: LABEL_SIZES[1], // Avery 5160
  dataRows: [],
  previewRowIndex: 0,
  activeObjectId: null,
  isDirty: false,

  setLabelId: (id) => set({ labelId: id }),
  setLabelName: (name) => set({ labelName: name, isDirty: true }),
  setSelectedSize: (size) => set({ selectedSize: size }),
  setDataRows: (rows) => set({ dataRows: rows }),
  setPreviewRowIndex: (i) => set({ previewRowIndex: i }),
  setActiveObjectId: (id) => set({ activeObjectId: id }),
  setDirty: (dirty) => set({ isDirty: dirty }),
}))
