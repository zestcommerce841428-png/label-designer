'use client'

import { useEffect, useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Save, Download, Printer, ChevronLeft, BarChart2, Layers, Terminal, Grid2x2, X, BookOpen, Magnet, ZoomIn, ZoomOut, FileDown, Copy, Upload } from 'lucide-react'
import { useEditorStore } from '@/lib/store/editor'
import { saveLabel, logPrintJob, saveAsNewLabel } from '@/actions/labels'
import { LABEL_SIZES } from '@/lib/label-sizes'
import { getCanvas, setZoom, getZoom } from '@/components/editor/FabricCanvas'
import DataImportPanel from '@/components/editor/DataImportPanel'
import ErrorBoundary from '@/components/ErrorBoundary'
import { resetToTemplates } from '@/lib/merge'
import { batchPrint } from '@/lib/canvas/batch'
import { MAX_BATCH_ROWS } from '@/lib/constants'
import { canvasToZpl, canvasToTspl } from '@/lib/export/zpl'
import { canvasToEpl } from '@/lib/export/epl'
import { canvasToCpcl } from '@/lib/export/cpcl'
import { canvasToDpl } from '@/lib/export/dpl'
import { exportBatchPdf } from '@/lib/export/batchPdf'
import { parseAlbl } from '@/lib/import/albl'
import { multiUpPrint, MULTIUP_PRESETS, type MultiUpLayout } from '@/lib/canvas/multiup'
import { toast } from '@/lib/store/toasts'
import type { Canvas } from 'fabric'

const FabricCanvas = dynamic(() => import('@/components/editor/FabricCanvas'), { ssr: false })
const Toolbar = dynamic(() => import('@/components/editor/Toolbar'), { ssr: false })
const PropertiesPanel = dynamic(() => import('@/components/editor/PropertiesPanel'), { ssr: false })

const FORMULA_GROUPS: { label: string; helpers: [string, string][] }[] = [
  { label: 'Text', helpers: [
    ['Left(s, n)', 'First n characters'],
    ['Right(s, n)', 'Last n characters'],
    ['Mid(s, start, len?)', 'Substring from start'],
    ['Trim(s)', 'Remove leading/trailing spaces'],
    ['Upper(s)', 'Uppercase'],
    ['Lower(s)', 'Lowercase'],
    ['Len(s)', 'String length'],
    ['Replace(s, find, rep)', 'Replace all occurrences'],
    ['Pad(s, width, char?, align?)', 'Pad string to width (L/R/C)'],
    ['Concat(...args)', 'Join values as string'],
    ['Split(s, sep, index?)', 'Split and pick index'],
    ['Contains(s, sub)', 'Returns true/false'],
    ['StartsWith(s, prefix)', 'Returns true/false'],
    ['EndsWith(s, suffix)', 'Returns true/false'],
  ]},
  { label: 'Numbers', helpers: [
    ['FormatNumber(n, decimals?, locale?)', 'Locale decimal format — e.g. 1,234.56'],
    ['FormatCurrency(n, currency?, locale?)', 'Currency format — e.g. $1,234.56'],
    ['CalcDiscount(price, original)', 'Discount % string — e.g. "−25%"'],
    ['Abs(n)', 'Absolute value'],
    ['Round(n, decimals?)', 'Round to N decimals'],
    ['Ceil(n, decimals?)', 'Round up'],
    ['Floor(n, decimals?)', 'Round down'],
    ['Min(...args)', 'Smallest value'],
    ['Max(...args)', 'Largest value'],
  ]},
  { label: 'Date / Time', helpers: [
    ['today(fmt?)', 'Today\'s date (default yyyy-MM-dd)'],
    ['now(fmt?)', 'Current time (default HH:mm:ss)'],
    ['fmt(value, pattern)', 'Format date — e.g. fmt(new Date(), "dd/MM/yyyy")'],
  ]},
  { label: 'GS1 / Barcode', helpers: [
    ['gs1(barcode, ai)', 'Parse GS1 AI — e.g. gs1(row.barcode, "gtin")'],
    ['If(cond, a, b)', 'Ternary — e.g. If(row.qty>0,"In stock","Out")'],
  ]},
]

type Label = {
  id: string
  name: string
  canvas_json: object
  size_config: { width: number; height: number; unit: string; bleedMm?: number; sampleData?: Record<string, string>[] }
}

export default function EditorClient({ label }: { label: Label }) {
  const router = useRouter()
  const { setLabelId, setLabelName, setSelectedSize, setBleedMm, setDataRows, labelName, selectedSize, bleedMm, dataRows, previewRowIndex, isDirty, setDirty } = useEditorStore()
  const [isPending, startTransition] = useTransition()
  const [showData, setShowData] = useState(false)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [showFormulas, setShowFormulas] = useState(false)
  const [zoomPct, setZoomPct] = useState(100)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)
  const [showSheetDialog, setShowSheetDialog] = useState(false)
  const [sheetPresetId, setSheetPresetId] = useState('avery-5160')
  const [customLayout, setCustomLayout] = useState<MultiUpLayout>({
    cols: 3, rows: 10, marginTopMm: 12.7, marginLeftMm: 4.8,
    gapHMm: 3.2, gapVMm: 0, pageWidthMm: 215.9, pageHeightMm: 279.4,
  })

  useEffect(() => {
    setLabelId(label.id)
    setLabelName(label.name)
    const size = LABEL_SIZES.find(s =>
      s.width === label.size_config.width && s.height === label.size_config.height
    )
    if (size) setSelectedSize(size)
    setBleedMm(label.size_config.bleedMm ?? 0)
    // Auto-load sample data if present and data panel is empty
    if (label.size_config.sampleData?.length && dataRows.length === 0) {
      setDataRows(label.size_config.sampleData)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label.id])

  // Ctrl+S shortcut dispatched from FabricCanvas keyboard handler
  useEffect(() => {
    const handler = () => handleSave()
    document.addEventListener('labelforge:save', handler)
    return () => document.removeEventListener('labelforge:save', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelName, selectedSize])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Auto-save after 30 s of inactivity when dirty
  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      const c = getCanvas()
      if (!c) return
      resetToTemplates(c)
      const json = c.toObject(['customData', 'id'])
      const thumbnail = c.toDataURL({ format: 'jpeg', multiplier: 0.4, quality: 0.7 })
      saveLabel(label.id, labelName, json, {
        width: selectedSize.width, height: selectedSize.height, unit: 'mm', bleedMm,
      }, thumbnail).then(() => {
        setDirty(false)
        toast.success('Auto-saved')
      }).catch(() => { /* non-critical */ })
    }, 30_000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, labelName, selectedSize])

  const SNAP_SIZE = 5 // mm grid size matches the visual dots

  const handleCanvasReady = useCallback((canvas: Canvas) => {
    if (label.canvas_json && Object.keys(label.canvas_json).length) {
      canvas.loadFromJSON(label.canvas_json).then(() => canvas.renderAll())
    }
    setDirty(false)
  }, [label.canvas_json, setDirty])

  // Wire snap-to-grid on the live canvas whenever the toggle changes
  useEffect(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const mmToPxLocal = (mm: number) => Math.round(mm * 3.7795275591)
    const gridPx = mmToPxLocal(SNAP_SIZE)

    function snapHandler(e: { target?: { left?: number; top?: number; setCoords?: () => void } | null }) {
      const obj = e.target
      if (!obj) return
      obj.left = Math.round((obj.left ?? 0) / gridPx) * gridPx
      obj.top  = Math.round((obj.top  ?? 0) / gridPx) * gridPx
      obj.setCoords?.()
    }

    if (snapToGrid) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.on('object:moving', snapHandler as any)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.off('object:moving', snapHandler as any)
    }
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvas.off('object:moving', snapHandler as any)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapToGrid])

  function handleSave() {
    const c = getCanvas()
    if (!c) return
    // Reset merged preview text back to {{template}} before saving so the
    // stored JSON always contains placeholders, not last-previewed values.
    resetToTemplates(c)
    const json = c.toObject(['customData', 'id'])
    // Generate a small thumbnail for the dashboard card
    const thumbnail = c.toDataURL({ format: 'jpeg', multiplier: 0.4, quality: 0.7 })
    startTransition(async () => {
      try {
        await saveLabel(label.id, labelName, json, {
          width: selectedSize.width, height: selectedSize.height, unit: 'mm', bleedMm,
        }, thumbnail)
        setDirty(false)
        toast.success('Label saved')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  function handleSaveAsCopy() {
    const c = getCanvas()
    if (!c) return
    resetToTemplates(c)
    const json = c.toObject(['customData', 'id'])
    const copyName = `${labelName} (copy)`
    startTransition(async () => {
      try {
        const newId = await saveAsNewLabel(label.id, copyName, json, {
          width: selectedSize.width, height: selectedSize.height, unit: 'mm', bleedMm,
        })
        toast.success('Saved as copy')
        router.push(`/editor/${newId}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  async function handleBatchPrint() {
    const c = getCanvas()
    if (!c) return
    const capped = dataRows.slice(0, MAX_BATCH_ROWS)
    if (dataRows.length > MAX_BATCH_ROWS) {
      if (!confirm(`Only the first ${MAX_BATCH_ROWS} records will be printed. Continue?`)) return
    }
    const templateJson = (() => {
      resetToTemplates(c)
      return c.toObject(['customData', 'id'])
    })()
    setBatchProgress({ current: 0, total: Math.max(1, capped.length) })
    try {
      await batchPrint(
        templateJson,
        capped,
        selectedSize.width,
        selectedSize.height,
        labelName,
        (current, total) => setBatchProgress({ current, total }),
      )
      startTransition(async () => {
        try {
          await logPrintJob(label.id, labelName, Math.max(1, capped.length))
        } catch { /* non-critical */ }
      })
    } finally {
      setBatchProgress(null)
    }
  }

  async function handleSheetPrint() {
    const c = getCanvas()
    if (!c) return
    const layout = sheetPresetId === 'custom'
      ? customLayout
      : (MULTIUP_PRESETS.find(p => p.id === sheetPresetId) ?? MULTIUP_PRESETS[1]).layout
    const capped = dataRows.slice(0, MAX_BATCH_ROWS)
    const templateJson = (() => { resetToTemplates(c); return c.toObject(['customData', 'id']) })()
    setShowSheetDialog(false)
    setBatchProgress({ current: 0, total: Math.max(1, capped.length) })
    try {
      await multiUpPrint(
        templateJson,
        capped,
        selectedSize.width,
        selectedSize.height,
        labelName,
        layout,
        (current, total) => setBatchProgress({ current, total }),
      )
      startTransition(async () => {
        try { await logPrintJob(label.id, labelName, Math.max(1, capped.length)) } catch { /* non-critical */ }
      })
    } finally {
      setBatchProgress(null)
    }
  }

  function handleExportPNG() {
    const c = getCanvas()
    if (!c) return
    const dataURL = c.toDataURL({ format: 'png', multiplier: 2 })
    const a = document.createElement('a')
    a.href = dataURL
    a.download = `${labelName}.png`
    a.click()
  }

  function adjustZoom(delta: number) {
    const next = Math.max(25, Math.min(400, Math.round(getZoom() * 100 + delta)))
    setZoom(next / 100)
    setZoomPct(next)
  }

  function handleExportJPEG() {
    const c = getCanvas()
    if (!c) return
    const dataURL = c.toDataURL({ format: 'jpeg', multiplier: 2, quality: 0.92 })
    const a = document.createElement('a')
    a.href = dataURL
    a.download = `${labelName}.jpg`
    a.click()
  }

  async function handleExportPDF() {
    const c = getCanvas()
    if (!c) return
    resetToTemplates(c)
    const dataURL = c.toDataURL({ format: 'png', multiplier: 3 })
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { margin: 0; size: ${selectedSize.width}mm ${selectedSize.height}mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { margin: 0; }
  img { width: ${selectedSize.width}mm; height: ${selectedSize.height}mm; display: block; }
</style></head>
<body><img src="${dataURL}" /></body></html>`
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, width: selectedSize.width, height: selectedSize.height }),
      })
      if (!res.ok) throw new Error('PDF service unavailable')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${labelName}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: open as printable HTML
      const w = window.open('', '_blank')
      if (w) { w.document.write(html); w.document.close() }
    }
  }

  async function handleExportBatchPdf() {
    const c = getCanvas()
    if (!c || dataRows.length === 0) return
    const capped = dataRows.slice(0, MAX_BATCH_ROWS)
    if (dataRows.length > MAX_BATCH_ROWS) {
      if (!confirm(`Only the first ${MAX_BATCH_ROWS} records will be exported. Continue?`)) return
    }
    resetToTemplates(c)
    setBatchProgress({ current: 0, total: capped.length })
    try {
      await exportBatchPdf(c, capped, {
        labelWidthMm: selectedSize.width,
        labelHeightMm: selectedSize.height,
        onProgress: (current, total) => setBatchProgress({ current, total }),
      })
    } finally {
      setBatchProgress(null)
    }
  }

  function handleExportPrn() {
    const c = getCanvas()
    if (!c) return
    resetToTemplates(c)
    const raw = canvasToZpl(c, selectedSize.width, selectedSize.height)
    const blob = new Blob([raw], { type: 'application/octet-stream' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${labelName}.prn`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function handleExportZpl(format: 'zpl' | 'tspl' | 'epl' | 'cpcl' | 'dpl') {
    const c = getCanvas()
    if (!c) return
    resetToTemplates(c)
    let raw: string
    let ext: string
    if (format === 'zpl') {
      raw = canvasToZpl(c, selectedSize.width, selectedSize.height)
      ext = 'zpl'
    } else if (format === 'tspl') {
      raw = canvasToTspl(c, selectedSize.width, selectedSize.height)
      ext = 'tspl'
    } else if (format === 'epl') {
      raw = canvasToEpl(c, selectedSize.width, selectedSize.height)
      ext = 'epl'
    } else if (format === 'cpcl') {
      raw = canvasToCpcl(c, selectedSize.width, selectedSize.height)
      ext = 'cpcl'
    } else {
      raw = canvasToDpl(c, selectedSize.width, selectedSize.height)
      ext = 'dpl'
    }
    const blob = new Blob([raw], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${labelName}.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function handleImportAlbl() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.albl'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      const result = parseAlbl(text)
      if (!result) { toast.error('Invalid .albl file'); return }
      const c = getCanvas()
      if (!c) return
      // Update label size if it differs
      const match = LABEL_SIZES.find(s =>
        Math.abs(s.width - result.widthMm) < 0.5 && Math.abs(s.height - result.heightMm) < 0.5
      )
      if (match) setSelectedSize(match)
      await c.loadFromJSON(result.canvasJson)
      c.renderAll()
      setDirty(true)
      toast.success(`Imported ${file.name} — barcode placeholders need to be converted via the toolbar`)
    }
    input.click()
  }

  function handlePrint() {
    const c = getCanvas()
    if (!c) return
    const dataURL = c.toDataURL({ format: 'png', multiplier: 3 })
    const w = window.open('', '_blank')!
    w.document.write(`
      <html><head><title>Print — ${labelName}</title>
      <style>
        @page { margin: 0; size: ${selectedSize.width}mm ${selectedSize.height}mm; }
        body { margin: 0; padding: 0; }
        img { width: 100%; height: auto; display: block; }
      </style></head>
      <body><img src="${dataURL}" onload="window.print();window.close()" /></body></html>
    `)
    w.document.close()
    startTransition(async () => {
      try {
        await logPrintJob(label.id, labelName, Math.max(1, dataRows.length))
      } catch {
        // Print job logging is non-critical; don't surface the error
      }
    })
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-1.5 px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border)] shrink-0 overflow-x-auto">
        <button type="button" title="Back to dashboard" onClick={() => router.push('/dashboard')} className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors shrink-0">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <input
          value={labelName}
          onChange={e => setLabelName(e.target.value)}
          className="min-w-[120px] max-w-[200px] text-sm font-semibold bg-transparent border-none outline-none text-[var(--fg)] shrink-0"
          placeholder="Label name"
        />
        <span className="text-xs text-[var(--fg-subtle)] shrink-0 hidden lg:inline">
          {selectedSize.width}×{selectedSize.height}mm
        </span>
        <label className="hidden xl:flex items-center gap-1 text-xs text-[var(--fg-muted)] shrink-0">
          Bleed
          <input
            type="number" min="0" max="10" step="0.5"
            title="Bleed margin (mm)"
            value={bleedMm}
            onChange={e => setBleedMm(Math.max(0, +e.target.value))}
            className="w-12 border border-[var(--border)] rounded bg-[var(--bg-subtle)] text-[var(--fg)] px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          mm
        </label>
        {dataRows.length > 0 && (
          <span className="text-xs text-[var(--fg-subtle)] shrink-0 hidden sm:inline">
            Row {previewRowIndex + 1}/{dataRows.length}
          </span>
        )}
        {isDirty && <span className="text-xs text-amber-500 shrink-0">●</span>}
        <div className="w-px h-5 bg-[var(--border)] mx-0.5 shrink-0" />
        <button
          type="button" onClick={() => setShowData(p => !p)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${showData ? 'bg-blue-600 text-white' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]'}`}
        >
          <BarChart2 className="w-3.5 h-3.5" /> Data
        </button>
        <button type="button" title="Formula reference" onClick={() => setShowFormulas(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <BookOpen className="w-3.5 h-3.5" /> Formulas
        </button>
        <button type="button" onClick={() => setSnapToGrid(p => !p)} title="Snap to grid (5mm)"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${snapToGrid ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]'}`}>
          <Magnet className="w-3.5 h-3.5" /> Snap
        </button>
        <div className="w-px h-5 bg-[var(--border)] mx-0.5 shrink-0" />
        <button type="button" onClick={handleExportPNG} title="Export as PNG" className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Download className="w-3.5 h-3.5" /> PNG
        </button>
        <button type="button" onClick={handleExportJPEG} title="Export as JPEG" className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Download className="w-3.5 h-3.5" /> JPG
        </button>
        <button type="button" onClick={handleExportPDF} title="Export as PDF (single label)" className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <FileDown className="w-3.5 h-3.5" /> PDF
        </button>
        {dataRows.length > 0 && (
          <button type="button" onClick={handleExportBatchPdf} disabled={!!batchProgress}
            title={`Export all ${dataRows.length} rows as a multi-page PDF`}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] disabled:opacity-50 transition-colors shrink-0">
            <FileDown className="w-3.5 h-3.5" />
            {batchProgress ? `PDF ${batchProgress.current}/${batchProgress.total}` : `PDF×${dataRows.length}`}
          </button>
        )}
        <div className="w-px h-5 bg-[var(--border)] mx-0.5 shrink-0" />
        <button type="button" onClick={() => handleExportZpl('zpl')} title="Download ZPL II (Zebra printers)" className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Terminal className="w-3.5 h-3.5" /> ZPL
        </button>
        <button type="button" onClick={() => handleExportZpl('tspl')} title="Download TSPL (TSC printers)" className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Terminal className="w-3.5 h-3.5" /> TSPL
        </button>
        <button type="button" onClick={() => handleExportZpl('epl')} title="Download EPL2 (Zebra LP/TLP)" className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Terminal className="w-3.5 h-3.5" /> EPL
        </button>
        <button type="button" onClick={() => handleExportZpl('cpcl')} title="Download CPCL (Intermec/Honeywell)" className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Terminal className="w-3.5 h-3.5" /> CPCL
        </button>
        <button type="button" onClick={() => handleExportZpl('dpl')} title="Download DPL (Datamax-O'Neil)" className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Terminal className="w-3.5 h-3.5" /> DPL
        </button>
        <button type="button" onClick={handleExportPrn} title="Download PRN raw print file (.prn)" className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Terminal className="w-3.5 h-3.5" /> PRN
        </button>
        <div className="w-px h-5 bg-[var(--border)] mx-0.5 shrink-0" />
        <button type="button" onClick={handlePrint} title="Print single label" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
        <button type="button" onClick={() => setShowSheetDialog(true)} title="Print on label sheet (Avery / multi-up)" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Grid2x2 className="w-3.5 h-3.5" /> Sheet
        </button>
        <button
          type="button"
          onClick={handleBatchPrint}
          disabled={!!batchProgress}
          title={dataRows.length ? `Batch print ${dataRows.length} records` : 'Print single copy'}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] disabled:opacity-50 transition-colors shrink-0"
        >
          <Layers className="w-3.5 h-3.5" />
          {batchProgress
            ? `${batchProgress.current}/${batchProgress.total}`
            : dataRows.length
              ? `Batch (${dataRows.length})`
              : 'Batch'}
        </button>
        <div className="flex items-center gap-0 border border-[var(--border)] rounded-lg overflow-hidden shrink-0">
          <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => adjustZoom(-25)}
            className="px-1.5 py-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition-colors">
            <ZoomOut className="w-3.5 h-3.5" aria-hidden />
          </button>
          <button type="button" title="Reset zoom to 100%" aria-label={`Zoom ${zoomPct}%`}
            onClick={() => { setZoom(1); setZoomPct(100) }}
            className="px-1.5 py-1.5 text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition-colors min-w-[2.5rem] text-center">
            {zoomPct}%
          </button>
          <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => adjustZoom(25)}
            className="px-1.5 py-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] transition-colors">
            <ZoomIn className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>
        <div className="w-px h-5 bg-[var(--border)] mx-0.5 shrink-0" />
        <button type="button" onClick={handleImportAlbl} title="Import AzureLabel .albl design file"
          className="flex items-center gap-1 px-2.5 py-1.5 border border-[var(--border)] text-[var(--fg-muted)] rounded-lg text-xs font-medium hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] transition-colors shrink-0">
          <Upload className="w-3.5 h-3.5" /> .albl
        </button>
        <button
          type="button"
          onClick={handleSaveAsCopy}
          disabled={isPending}
          title="Save a copy of this label"
          className="flex items-center gap-1 px-2.5 py-1.5 border border-[var(--border)] text-[var(--fg-muted)] rounded-lg text-xs font-medium hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] disabled:opacity-50 transition-colors shrink-0"
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </header>

      <ErrorBoundary fallback={
        <div className="flex items-center justify-center h-10 text-xs text-red-500 bg-red-50 border-b border-red-100 px-4">
          Toolbar failed to load — refresh the page to retry.
        </div>
      }>
        <Toolbar />
      </ErrorBoundary>

      <div className="flex flex-1 overflow-hidden">
        <ErrorBoundary>
          <FabricCanvas onCanvasReady={handleCanvasReady} />
        </ErrorBoundary>
        {showData && <DataImportPanel />}
        <ErrorBoundary>
          <PropertiesPanel />
        </ErrorBoundary>
      </div>

      {/* Formula cheat sheet */}
      {showFormulas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowFormulas(false)}>
          <div className="bg-[var(--bg-card)] rounded-xl shadow-xl w-[520px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)]">
              <h2 className="text-sm font-semibold text-[var(--fg)]">Formula Reference</h2>
              <button type="button" title="Close" aria-label="Close formula reference" onClick={() => setShowFormulas(false)} className="text-[var(--fg-subtle)] hover:text-[var(--fg)]"><X className="w-4 h-4" aria-hidden /></button>
            </div>
            <div className="px-5 py-4 space-y-5 text-xs">
              <p className="text-[var(--fg-muted)]">Use <code className="bg-[var(--bg-subtle)] px-1 rounded border border-[var(--border)]">{'{{=expr}}'}</code> in any text element to run a JS formula. Access row data via <code className="bg-[var(--bg-subtle)] px-1 rounded border border-[var(--border)]">row.field</code>.</p>
              {FORMULA_GROUPS.map(g => (
                <div key={g.label}>
                  <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">{g.label}</p>
                  <div className="space-y-1.5">
                    {g.helpers.map(([sig, desc]) => (
                      <div key={sig} className="flex gap-3">
                        <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">{sig}</code>
                        <span className="text-[var(--fg-muted)]">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">Counters</p>
                <div className="space-y-1.5">
                  {[
                    ['{{#counter}}', 'Auto-incrementing serial number (1, 2, 3…)'],
                    ['{{#counter:10:2:4}}', 'Start 10, step 2, zero-pad to 4 digits → 0010'],
                    ['{{#label_counter}}', 'Current label number in batch'],
                    ['{{#record_counter}}', 'Same as label_counter'],
                    ['{{#total_records}}', 'Total number of data rows'],
                  ].map(([sig, desc]) => (
                    <div key={sig} className="flex gap-3">
                      <code className="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">{sig}</code>
                      <span className="text-[var(--fg-muted)]">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">Keyboard Shortcuts</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    ['Ctrl+S', 'Save label'],
                    ['Ctrl+Z / Ctrl+Y', 'Undo / Redo'],
                    ['Ctrl+C / Ctrl+V', 'Copy / Paste element'],
                    ['Ctrl+D', 'Duplicate element'],
                    ['Ctrl+A', 'Select all elements'],
                    ['Ctrl+G / Ctrl+Shift+G', 'Group / Ungroup layer'],
                    ['Ctrl+] / Ctrl+[', 'Bring forward / Send back'],
                    ['Ctrl+Shift+] / [', 'Bring to front / Send to back'],
                    ['Ctrl+= / Ctrl+-', 'Zoom in / Zoom out'],
                    ['Ctrl+0', 'Reset zoom to 100%'],
                    ['Arrow keys', 'Nudge 1px (Shift = 10px)'],
                    ['Delete / Backspace', 'Delete selected'],
                    ['Escape', 'Deselect'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-baseline gap-2">
                      <kbd className="text-[10px] bg-[var(--bg-subtle)] text-[var(--fg-muted)] px-1.5 py-0.5 rounded border border-[var(--border)] font-mono shrink-0">{key}</kbd>
                      <span className="text-[var(--fg-muted)]">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider mb-2">HTTP Requests</p>
                <div className="space-y-1.5">
                  <div className="flex gap-3">
                    <code className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded shrink-0">await httpGet(url)</code>
                    <span className="text-[var(--fg-muted)]">Fetch URL and return body as text (SSRF-protected, HTTPS only)</span>
                  </div>
                  <p className="text-[var(--fg-subtle)] italic">Example: <code className="bg-[var(--bg-subtle)] border border-[var(--border)] px-1 rounded">{'{{= JSON.parse(await httpGet("https://api.example.com/price?sku="+row.sku)).price }}'}</code></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sheet print dialog */}
      {showSheetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-xl w-[440px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--fg)]">Sheet / Multi-up Print</h2>
              <button type="button" title="Close" aria-label="Close sheet dialog" onClick={() => setShowSheetDialog(false)} className="text-[var(--fg-subtle)] hover:text-[var(--fg)]">
                <X className="w-4 h-4" aria-hidden />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--fg-muted)] block mb-1">Layout preset</label>
                <select
                  title="Sheet preset"
                  className="w-full text-sm border border-[var(--border)] rounded-xl px-2 py-1.5 bg-[var(--bg-subtle)] text-[var(--fg)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={sheetPresetId}
                  onChange={e => {
                    setSheetPresetId(e.target.value)
                    const preset = MULTIUP_PRESETS.find(p => p.id === e.target.value)
                    if (preset && e.target.value !== 'custom') setCustomLayout(preset.layout)
                  }}
                >
                  {MULTIUP_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {([
                  ['Columns', 'cols', 1, 20, 1],
                  ['Rows', 'rows', 1, 30, 1],
                  ['Top margin (mm)', 'marginTopMm', 0, 50, 0.1],
                  ['Left margin (mm)', 'marginLeftMm', 0, 50, 0.1],
                  ['H gap (mm)', 'gapHMm', 0, 30, 0.1],
                  ['V gap (mm)', 'gapVMm', 0, 30, 0.1],
                  ['Page width (mm)', 'pageWidthMm', 50, 500, 0.1],
                  ['Page height (mm)', 'pageHeightMm', 50, 700, 0.1],
                ] as [string, keyof MultiUpLayout, number, number, number][]).map(([label, key, min, max, step]) => (
                  <div key={key}>
                    <label className="text-xs text-[var(--fg-subtle)] block mb-0.5">{label}</label>
                    <input
                      type="number"
                      min={min} max={max} step={step}
                      title={label}
                      className="w-full text-sm border border-[var(--border)] rounded-lg bg-[var(--bg-subtle)] text-[var(--fg)] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customLayout[key]}
                      onChange={e => {
                        setSheetPresetId('custom')
                        setCustomLayout(prev => ({ ...prev, [key]: +e.target.value }))
                      }}
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-[var(--fg-subtle)]">
                {dataRows.length
                  ? `${dataRows.length} data row(s) → ${Math.ceil(dataRows.length / (customLayout.cols * customLayout.rows))} sheet(s)`
                  : 'No data loaded — will print 1 label per sheet.'}
              </p>

              <div className="flex gap-2 pt-1">
                <button type="button" title="Cancel" onClick={() => setShowSheetDialog(false)}
                  className="flex-1 px-4 py-2 text-sm border border-[var(--border)] text-[var(--fg-muted)] rounded-xl hover:bg-[var(--bg-subtle)] transition-colors">
                  Cancel
                </button>
                <button type="button" title="Print sheet" onClick={handleSheetPrint} disabled={!!batchProgress}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-sm">
                  {batchProgress ? `${batchProgress.current}/${batchProgress.total}` : 'Print Sheet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
