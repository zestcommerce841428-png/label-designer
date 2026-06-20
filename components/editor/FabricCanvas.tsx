'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Canvas, Circle, IText } from 'fabric'
import { useEditorStore } from '@/lib/store/editor'
import { mmToPx } from '@/lib/label-sizes'

let _canvas: Canvas | null = null
export function getCanvas() { return _canvas }

type Props = {
  onCanvasReady?: (canvas: Canvas) => void
}

export default function FabricCanvas({ onCanvasReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { selectedSize, setActiveObjectId, setDirty, dataRows, previewRowIndex } = useEditorStore()

  const labelW = mmToPx(selectedSize.width)
  const labelH = mmToPx(selectedSize.height)
  const SCALE = Math.min(560 / labelW, 480 / labelH, 1.5)

  const mergeData = useCallback((canvas: Canvas) => {
    if (!dataRows.length) return
    const row = dataRows[previewRowIndex] ?? dataRows[0]
    canvas.getObjects().forEach((obj) => {
      const custom = (obj as unknown as { customData?: { template?: string } }).customData
      if (!custom?.template) return
      const merged = custom.template.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => row[key] ?? '')
      if (obj.type === 'i-text' || obj.type === 'text') {
        (obj as IText).set({ text: merged })
      }
    })
    canvas.renderAll()
  }, [dataRows, previewRowIndex])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new Canvas(canvasRef.current, {
      width: labelW * SCALE,
      height: labelH * SCALE,
      backgroundColor: '#ffffff',
    })
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
    canvas.on('selection:cleared', () => setActiveObjectId(null))
    canvas.on('object:modified', () => setDirty(true))

    _canvas = canvas
    onCanvasReady?.(canvas)

    return () => {
      canvas.dispose()
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
      {/* eslint-disable-next-line react/forbid-dom-props -- dynamic label dimensions require inline size */}
      <div
        className="shadow-xl ring-1 ring-zinc-300 fabric-canvas-wrapper"
        style={
          { '--canvas-w': `${canvasW}px`, '--canvas-h': `${canvasH}px` } as React.CSSProperties
        }
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
