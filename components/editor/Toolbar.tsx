'use client'

import {
  Type, AlignJustify, Square, Circle as CircleIcon, Minus, Triangle as TriangleIcon, Image as ImageIcon, FileImage, Maximize2, Crosshair, FlipHorizontal2, FlipVertical2,
  QrCode, Undo2, Redo2, Trash2, Copy, AlignLeft, AlignCenter, AlignRight,
  Group, Ungroup, ChevronsUp, ChevronsDown, ChevronUp, ChevronDown,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  StretchHorizontal, StretchVertical, Clipboard,
} from 'lucide-react'
import { getCanvas } from './FabricCanvas'
import {
  addText, addTextbox, addRect, addCircle, addTriangle, addLine, addBarcode, addQR,
  addImage, addSvg, deleteSelected, duplicateSelected, setTextAlign,
  groupSelected, ungroupSelected,
  bringToFront, sendToBack, bringForward, sendBackward,
  alignObjects, distributeObjects, pasteFromClipboard,
  centerOnLabel, fitToLabel, flipHorizontal, flipVertical,
} from '@/lib/canvas/elements'
import { undo, redo } from '@/lib/canvas/history'
import { useEditorStore } from '@/lib/store/editor'
import { mmToPx } from '@/lib/label-sizes'

function withCanvas(fn: (c: ReturnType<typeof getCanvas> & object) => void) {
  return () => {
    const c = getCanvas()
    if (c) fn(c)
  }
}

function Tool({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center justify-center w-8 h-8 rounded hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-[var(--border)] mx-0.5" />
}

export default function Toolbar() {
  const { bleedMm } = useEditorStore()
  const bleedPx = mmToPx(bleedMm)

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border)] flex-wrap shrink-0">
      <span className="text-xs font-semibold text-[var(--fg-subtle)] uppercase tracking-wider mr-2">Add</span>
      <Tool icon={Type}           label="Text"      onClick={withCanvas(addText)} />
      <Tool icon={AlignJustify}   label="Textbox"   onClick={withCanvas(addTextbox)} />
      <Tool icon={Square}      label="Rectangle" onClick={withCanvas(addRect)} />
      <Tool icon={CircleIcon}   label="Circle"    onClick={withCanvas(addCircle)} />
      <Tool icon={TriangleIcon} label="Triangle"  onClick={withCanvas(addTriangle)} />
      <Tool icon={Minus}        label="Line"      onClick={withCanvas(addLine)} />
      <Tool icon={ImageIcon}   label="Image"     onClick={withCanvas(addImage)} />
      <Tool icon={FileImage}   label="SVG"       onClick={withCanvas(addSvg)} />
      <Tool icon={QrCode}      label="QR Code"   onClick={withCanvas(addQR)} />
      <button
        type="button"
        onClick={withCanvas(addBarcode)}
        title="Barcode (EAN-13)"
        aria-label="Add barcode"
        className="flex items-center gap-1 px-2 h-8 rounded hover:bg-[var(--bg-subtle)] text-[var(--fg-muted)] text-xs font-medium transition-colors"
      >
        ▮▯▮ Barcode
      </button>

      <Sep />
      <span className="text-xs font-semibold text-[var(--fg-subtle)] uppercase tracking-wider mr-1">Text</span>
      <Tool icon={AlignLeft}   label="Text Left"   onClick={withCanvas(c => setTextAlign(c, 'left'))} />
      <Tool icon={AlignCenter} label="Text Center" onClick={withCanvas(c => setTextAlign(c, 'center'))} />
      <Tool icon={AlignRight}  label="Text Right"  onClick={withCanvas(c => setTextAlign(c, 'right'))} />

      <Sep />
      <span className="text-xs font-semibold text-[var(--fg-subtle)] uppercase tracking-wider mr-1">Align</span>
      <Tool icon={AlignStartHorizontal}  label="Align Top"    onClick={withCanvas(c => alignObjects(c, 'top'))} />
      <Tool icon={AlignCenterHorizontal} label="Align Middle" onClick={withCanvas(c => alignObjects(c, 'middle'))} />
      <Tool icon={AlignEndHorizontal}    label="Align Bottom" onClick={withCanvas(c => alignObjects(c, 'bottom'))} />
      <Tool icon={AlignStartVertical}    label="Align Left"   onClick={withCanvas(c => alignObjects(c, 'left'))} />
      <Tool icon={AlignCenterVertical}   label="Align Center" onClick={withCanvas(c => alignObjects(c, 'center'))} />
      <Tool icon={AlignEndVertical}      label="Align Right"  onClick={withCanvas(c => alignObjects(c, 'right'))} />
      <Tool icon={StretchHorizontal}     label="Distribute Horizontally" onClick={withCanvas(c => distributeObjects(c, 'h'))} />
      <Tool icon={StretchVertical}       label="Distribute Vertically"   onClick={withCanvas(c => distributeObjects(c, 'v'))} />

      <Sep />
      <Tool icon={Group}   label="Group (Layer)"  onClick={withCanvas(groupSelected)} />
      <Tool icon={Ungroup} label="Ungroup Layer"  onClick={withCanvas(ungroupSelected)} />

      <Sep />
      <span className="text-xs font-semibold text-[var(--fg-subtle)] uppercase tracking-wider mr-1">Order</span>
      <Tool icon={ChevronsUp}   label="Bring to Front"  onClick={withCanvas(bringToFront)} />
      <Tool icon={ChevronUp}    label="Bring Forward"   onClick={withCanvas(bringForward)} />
      <Tool icon={ChevronDown}  label="Send Backward"   onClick={withCanvas(sendBackward)} />
      <Tool icon={ChevronsDown} label="Send to Back"    onClick={withCanvas(sendToBack)} />

      <Sep />
      <Tool icon={Crosshair}       label="Center on label"   onClick={withCanvas(c => centerOnLabel(c, bleedPx))} />
      <Tool icon={Maximize2}       label="Fit to label"      onClick={withCanvas(c => fitToLabel(c, bleedPx))} />
      <Tool icon={FlipHorizontal2} label="Flip horizontal"   onClick={withCanvas(flipHorizontal)} />
      <Tool icon={FlipVertical2}   label="Flip vertical"     onClick={withCanvas(flipVertical)} />

      <Sep />
      <Tool icon={Clipboard} label="Paste Image (Ctrl+V)" onClick={withCanvas(c => pasteFromClipboard(c))} />
      <Tool icon={Copy}   label="Duplicate (Ctrl+D)" onClick={withCanvas(duplicateSelected)} />
      <Tool icon={Trash2} label="Delete (Del)"       onClick={withCanvas(deleteSelected)} />

      <Sep />
      <Tool icon={Undo2}  label="Undo" onClick={withCanvas(undo)} />
      <Tool icon={Redo2}  label="Redo" onClick={withCanvas(redo)} />
    </div>
  )
}
