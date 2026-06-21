'use client'

import { useEffect, useCallback, useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Save, Download, Printer, ChevronLeft, BarChart2, Layers, Terminal, Grid2x2, X } from 'lucide-react'
import { useEditorStore } from '@/lib/store/editor'
import { saveLabel, logPrintJob } from '@/actions/labels'
import { LABEL_SIZES, mmToPx } from '@/lib/label-sizes'
import { getCanvas } from '@/components/editor/FabricCanvas'
import DataImportPanel from '@/components/editor/DataImportPanel'
import ErrorBoundary from '@/components/ErrorBoundary'
import { resetToTemplates } from '@/lib/merge'
import { batchPrint } from '@/lib/canvas/batch'
import { MAX_BATCH_ROWS } from '@/lib/constants'
import { canvasToZpl, canvasToTspl } from '@/lib/export/zpl'
import { multiUpPrint, MULTIUP_PRESETS, type MultiUpLayout } from '@/lib/canvas/multiup'
import type { Canvas } from 'fabric'

const FabricCanvas = dynamic(() => import('@/components/editor/FabricCanvas'), { ssr: false })
const Toolbar = dynamic(() => import('@/components/editor/Toolbar'), { ssr: false })
const PropertiesPanel = dynamic(() => import('@/components/editor/PropertiesPanel'), { ssr: false })

type Label = {
  id: string
  name: string
  canvas_json: object
  size_config: { width: number; height: number; unit: string }
}

export default function EditorClient({ label }: { label: Label }) {
  const router = useRouter()
  const { setLabelId, setLabelName, setSelectedSize, labelName, selectedSize, dataRows, isDirty, setDirty } = useEditorStore()
  const [isPending, startTransition] = useTransition()
  const [showData, setShowData] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
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
  }, [label, setLabelId, setLabelName, setSelectedSize])

  const handleCanvasReady = useCallback((canvas: Canvas) => {
    if (label.canvas_json && Object.keys(label.canvas_json).length) {
      canvas.loadFromJSON(label.canvas_json).then(() => canvas.renderAll())
    }
    setDirty(false)
  }, [label.canvas_json, setDirty])

  function handleSave() {
    const c = getCanvas()
    if (!c) return
    // Reset merged preview text back to {{template}} before saving so the
    // stored JSON always contains placeholders, not last-previewed values.
    resetToTemplates(c)
    const json = c.toObject(['customData', 'id'])
    setSaveError(null)
    startTransition(async () => {
      try {
        await saveLabel(label.id, labelName, json, {
          width: selectedSize.width, height: selectedSize.height, unit: 'mm',
        })
        setDirty(false)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Save failed')
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

  function handleExportZpl(format: 'zpl' | 'tspl') {
    const c = getCanvas()
    if (!c) return
    resetToTemplates(c)
    const raw = format === 'zpl'
      ? canvasToZpl(c, selectedSize.width, selectedSize.height)
      : canvasToTspl(c, selectedSize.width, selectedSize.height)
    const blob = new Blob([raw], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${labelName}.${format === 'zpl' ? 'zpl' : 'tspl'}`
    a.click()
    URL.revokeObjectURL(a.href)
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
      <header className="flex items-center gap-3 px-4 py-2 bg-white border-b border-zinc-200 shrink-0">
        <button type="button" title="Back to dashboard" onClick={() => router.push('/dashboard')} className="text-zinc-500 hover:text-zinc-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <input
          value={labelName}
          onChange={e => setLabelName(e.target.value)}
          className="flex-1 text-sm font-medium bg-transparent border-none outline-none text-zinc-900"
          placeholder="Label name"
        />
        {isDirty && <span className="text-xs text-zinc-400">Unsaved</span>}
        {saveError && <span className="text-xs text-red-500">{saveError}</span>}
        <button
          type="button" onClick={() => setShowData(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showData ? 'bg-blue-100 text-blue-700' : 'text-zinc-600 hover:bg-zinc-100'}`}
        >
          <BarChart2 className="w-4 h-4" /> Data
        </button>
        <button type="button" onClick={handleExportPNG} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
          <Download className="w-4 h-4" /> PNG
        </button>
        <button type="button" onClick={() => handleExportZpl('zpl')} title="Download ZPL II (Zebra printers)" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
          <Terminal className="w-4 h-4" /> ZPL
        </button>
        <button type="button" onClick={() => handleExportZpl('tspl')} title="Download TSPL (TSC printers)" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
          <Terminal className="w-4 h-4" /> TSPL
        </button>
        <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
          <Printer className="w-4 h-4" /> Print
        </button>
        <button type="button" onClick={() => setShowSheetDialog(true)} title="Print on label sheet (Avery / multi-up)" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors">
          <Grid2x2 className="w-4 h-4" /> Sheet
        </button>
        <button
          type="button"
          onClick={handleBatchPrint}
          disabled={!!batchProgress}
          title={dataRows.length ? `Batch print ${dataRows.length} records` : 'Print single copy'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
        >
          <Layers className="w-4 h-4" />
          {batchProgress
            ? `${batchProgress.current}/${batchProgress.total}`
            : dataRows.length
              ? `Batch (${dataRows.length})`
              : 'Batch'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
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

      {/* Sheet print dialog */}
      {showSheetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[440px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <h2 className="text-sm font-semibold text-zinc-900">Sheet / Multi-up Print</h2>
              <button type="button" onClick={() => setShowSheetDialog(false)} className="text-zinc-400 hover:text-zinc-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-600 block mb-1">Layout preset</label>
                <select
                  title="Sheet preset"
                  className="w-full text-sm border border-zinc-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

              {/* Custom layout fields — shown for all so user can tweak */}
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
                    <label className="text-xs text-zinc-500 block mb-0.5">{label}</label>
                    <input
                      type="number"
                      min={min} max={max} step={step}
                      title={label}
                      className="w-full text-sm border border-zinc-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={customLayout[key]}
                      onChange={e => {
                        setSheetPresetId('custom')
                        setCustomLayout(prev => ({ ...prev, [key]: +e.target.value }))
                      }}
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-zinc-400">
                {dataRows.length
                  ? `${dataRows.length} data row(s) → ${Math.ceil(dataRows.length / (customLayout.cols * customLayout.rows))} sheet(s)`
                  : 'No data loaded — will print 1 label per sheet.'}
              </p>

              <div className="flex gap-2 pt-1">
                <button type="button" title="Cancel" onClick={() => setShowSheetDialog(false)}
                  className="flex-1 px-4 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
                  Cancel
                </button>
                <button type="button" title="Print sheet" onClick={handleSheetPrint} disabled={!!batchProgress}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
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
