'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Canvas, Circle, IText } from 'fabric'
import { useEditorStore } from '@/lib/store/editor'
import { mmToPx } from '@/lib/label-sizes'
import { CANVAS_MAX_WIDTH_PX, CANVAS_MAX_HEIGHT_PX, CANVAS_MAX_SCALE } from '@/lib/constants'
import { applyMerge } from '@/lib/merge'
import {
  deleteSelected, duplicateSelected,
  groupSelected, ungroupSelected,
  bringToFront, sendToBack, bringForward, sendBackward,
  pasteFromClipboard, copySelected, pasteBuffer,
} from '@/lib/canvas/elements'
import { undo, redo } from '@/lib/canvas/history'

let _canvas: Canvas | null = null
let _baseScale = 1
let _userZoom  = 1
export function getCanvas() { return _canvas }
export function getZoom()   { return _userZoom }
export function setZoom(factor: number) {
  const c = _canvas
  if (!c) return
  _userZoom = Math.max(0.25, Math.min(4, factor))
  const z = _baseScale * _userZoom
  c.setZoom(z)
  c.setDimensions({ width: (c.width  ?? 0) / (_baseScale * (factor === _userZoom ? 1 : factor / _userZoom)),
                    height:(c.height ?? 0) / (_baseScale * (factor === _userZoom ? 1 : factor / _userZoom)) })
  // Simpler: recompute from base dimensions stored at init
  c.setDimensions({ width: _baseLabelW * z, height: _baseLabelH * z })
}
let _baseLabelW = 0, _baseLabelH = 0

type Props = {
  onCanvasReady?: (canvas: Canvas) => void
}

export default function FabricCanvas({ onCanvasReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { selectedSize, setActiveObjectId, setDirty, dataRows, previewRowIndex } = useEditorStore()

  const labelW = mmToPx(selectedSize.width)
  const labelH = mmToPx(selectedSize.height)
  const SCALE = Math.min(CANVAS_MAX_WIDTH_PX / labelW, CANVAS_MAX_HEIGHT_PX / labelH, CANVAS_MAX_SCALE)

  const mergeData = useCallback((canvas: Canvas) => {
    if (!dataRows.length) return
    const row = dataRows[previewRowIndex] ?? dataRows[0]
    applyMerge(canvas, row, previewRowIndex)
  }, [dataRows, previewRowIndex])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new Canvas(canvasRef.current, {
      width: labelW * SCALE,
      height: labelH * SCALE,
      backgroundColor: '#ffffff',
    })
    _baseScale = SCALE
    _userZoom  = 1
    _baseLabelW = labelW
    _baseLabelH = labelH
    canvas.setZoom(SCALE)

    // Grid dots
    const gridSize = mmToPx(5)
    for (let x = gridSize; x < labelW; x += gridSize) {
      for (let y = gridSize; y < labelH; y += gridSize) {
        const dot = new Circle({
          left: x, top: y, radius: 0.5,
          fill: '#d1d5db', selectable: false, evented: false,
          originX: 'center', originY: 'center',
        })
        canvas.add(dot)
      }
    }

    canvas.on('selection:created', (e) => {
      setActiveObjectId((e.selected?.[0] as unknown as { id?: string })?.id ?? null)
    })
    canvas.on('selection:updated', (e) => {
      setActiveObjectId((e.selected?.[0] as unknown as { id?: string })?.id ?? null)
    })
    canvas.on('selection:cleared', () => setActiveObjectId(null))
    canvas.on('object:modified', () => setDirty(true))

    _canvas = canvas
    onCanvasReady?.(canvas)

    // Keyboard shortcuts
    function onKeyDown(e: KeyboardEvent) {
      const c = _canvas
      if (!c) return
      const active = c.getActiveObject()
      // Don't intercept when user is typing inside a text element or an input/textarea
      if (active instanceof IText && active.isEditing) return
      if (document.activeElement instanceof HTMLInputElement) return
      if (document.activeElement instanceof HTMLTextAreaElement) return
      if (document.activeElement instanceof HTMLSelectElement) return

      const ctrl = e.ctrlKey || e.metaKey

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected(c)
      } else if (ctrl && e.key === 'z') {
        e.preventDefault()
        undo(c)
      } else if (ctrl && (e.key === 'y' || e.key === 'Z')) {
        e.preventDefault()
        redo(c)
      } else if (ctrl && e.key === 'd') {
        e.preventDefault()
        duplicateSelected(c)
      } else if (ctrl && e.key === 'g') {
        e.preventDefault()
        if (e.shiftKey) ungroupSelected(c)
        else groupSelected(c)
      } else if (e.key === 'Escape') {
        c.discardActiveObject()
        c.renderAll()
      } else if (ctrl && e.key === ']') {
        e.preventDefault()
        if (e.shiftKey) bringToFront(c)
        else bringForward(c)
      } else if (ctrl && e.key === '[') {
        e.preventDefault()
        if (e.shiftKey) sendToBack(c)
        else sendBackward(c)
      } else if (ctrl && e.key === 'c') {
        // Copy selected element to internal buffer (not system clipboard)
        copySelected(c)
      } else if (ctrl && e.key === 'v') {
        e.preventDefault()
        pasteBuffer(c)
      } else if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setZoom(Math.min(4, _userZoom + 0.25))
      } else if (ctrl && e.key === '-') {
        e.preventDefault()
        setZoom(Math.max(0.25, _userZoom - 0.25))
      } else if (ctrl && e.key === '0') {
        e.preventDefault()
        setZoom(1)
      } else if (!ctrl && active && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
        // Nudge selected element 1px (or 10px with Shift)
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0
        active.set({ left: (active.left ?? 0) + dx, top: (active.top ?? 0) + dy })
        c.renderAll()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      canvas.dispose()
      document.removeEventListener('keydown', onKeyDown)
      _canvas = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize.id])

  useEffect(() => {
    if (_canvas) mergeData(_canvas)
  }, [dataRows, previewRowIndex, mergeData])

  const canvasW = labelW * SCALE
  const canvasH = labelH * SCALE

  return (
    <div ref={containerRef} className="flex items-center justify-center flex-1 bg-zinc-100 overflow-auto p-6">
      {/*
        CSS custom properties must be set inline — they cannot live in an external stylesheet
        because their values are computed at runtime from label dimensions.
        eslint-disable-next-line react/forbid-dom-props
      */}
      {/* eslint-disable-next-line react/forbid-dom-props -- CSS custom properties require inline style; values are runtime-computed */}
      <div
        className="shadow-xl ring-1 ring-zinc-300 fabric-canvas-wrapper"
        // @ts-expect-error -- CSS custom properties are valid but not in React.CSSProperties
        style={{ '--canvas-w': `${canvasW}px`, '--canvas-h': `${canvasH}px` }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
