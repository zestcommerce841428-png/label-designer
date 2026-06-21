'use client'

import { useCallback, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Upload, ChevronLeft, ChevronRight, Sheet, RefreshCw, Braces, FileCode } from 'lucide-react'
import { useEditorStore, type DataRow } from '@/lib/store/editor'
import { MAX_IMPORT_FILE_BYTES } from '@/lib/constants'

type Tab = 'file' | 'json' | 'xml' | 'sheets'

/** Convert a Google Sheets share/edit URL to a CSV export URL */
function sheetsUrlToCsvUrl(input: string): string | null {
  // Already a published CSV link
  if (input.includes('output=csv')) return input

  // Extract spreadsheet ID from standard share/edit URL
  // e.g. https://docs.google.com/spreadsheets/d/<ID>/edit#gid=0
  const match = input.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) return null

  const id = match[1]
  // Extract optional gid (sheet tab)
  const gidMatch = input.match(/[#&?]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '0'

  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
}

export default function DataImportPanel() {
  const { dataRows, setDataRows, previewRowIndex, setPreviewRowIndex } = useEditorStore()
  const [columns, setColumns] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const [tab, setTab] = useState<Tab>('file')
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [sheetsUrl, setSheetsUrl] = useState('')
  const [sheetsLoading, setSheetsLoading] = useState(false)
  const [sheetsError, setSheetsError] = useState<string | null>(null)
  const [xmlText, setXmlText] = useState('')
  const [xmlError, setXmlError] = useState<string | null>(null)

  // ─── File import ───────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      alert('File too large. Maximum size is 10 MB.')
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'ods' || ext === 'odf') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const wb = XLSX.read(e.target!.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<DataRow>(ws, { defval: '' })
        const cols = data.length ? Object.keys(data[0]) : []
        setColumns(cols)
        setDataRows(data)
        setPreviewRowIndex(0)
      }
      reader.readAsBinaryString(file)
    } else if (ext === 'json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target!.result as string)
          const rows: DataRow[] = Array.isArray(parsed) ? parsed : parsed.data ?? parsed.records ?? parsed.rows ?? []
          if (!rows.length) { alert('JSON file contains no rows.'); return }
          const cols = Object.keys(rows[0])
          setColumns(cols)
          setDataRows(rows)
          setPreviewRowIndex(0)
        } catch {
          alert('Invalid JSON file.')
        }
      }
      reader.readAsText(file)
    } else if (ext === 'xml') {
      const reader = new FileReader()
      reader.onload = (e) => {
        parseXmlToRows(e.target!.result as string)
      }
      reader.readAsText(file)
    } else if (ext === 'csv') {
      Papa.parse<DataRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setColumns(result.meta.fields ?? [])
          setDataRows(result.data)
          setPreviewRowIndex(0)
        },
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const wb = XLSX.read(e.target!.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<DataRow>(ws, { defval: '' })
        const cols = data.length ? Object.keys(data[0]) : []
        setColumns(cols)
        setDataRows(data)
        setPreviewRowIndex(0)
      }
      reader.readAsBinaryString(file)
    }
  }, [setDataRows, setPreviewRowIndex])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  function parseXmlToRows(text: string, onError?: (msg: string) => void): boolean {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'application/xml')
      const parseErr = doc.querySelector('parsererror')
      if (parseErr) { const msg = 'Invalid XML.'; (onError ?? (() => alert(msg)))(msg); return false }

      const root = doc.documentElement

      // ── NiceLabel / Loftware print job XML ──────────────────────────────────
      // <PrintJob> or <NiceLabelPrintJob> with <Label> + repeating <Variables>/<Record>
      const isNiceLabel = /PrintJob|NiceLabel/i.test(root.tagName)
      if (isNiceLabel) {
        const jobNodes = root.tagName.toLowerCase().includes('printjob')
          ? [root]
          : Array.from(root.querySelectorAll('PrintJob'))

        const rows: DataRow[] = []
        for (const job of jobNodes) {
          // Each <Variables> or <Record> block becomes one row
          const varBlocks = Array.from(job.querySelectorAll('Variables, Record'))
          if (varBlocks.length === 0) {
            // Single-job with Variables as direct children
            const row: DataRow = {}
            for (const el of Array.from(job.querySelectorAll('Variable'))) {
              const name = el.getAttribute('Name') ?? el.getAttribute('name') ?? el.tagName
              row[name] = el.textContent ?? ''
            }
            const qty = parseInt(job.querySelector('Quantity')?.textContent ?? '1', 10)
            for (let q = 0; q < Math.max(1, qty); q++) rows.push({ ...row })
          } else {
            for (const block of varBlocks) {
              const row: DataRow = {}
              for (const el of Array.from(block.querySelectorAll('Variable'))) {
                const name = el.getAttribute('Name') ?? el.getAttribute('name') ?? el.tagName
                row[name] = el.textContent ?? ''
              }
              if (!Object.keys(row).length) {
                for (const child of Array.from(block.children)) row[child.tagName] = child.textContent ?? ''
              }
              rows.push(row)
            }
          }
        }
        if (!rows.length) { const msg = 'No variable records found in NiceLabel XML.'; (onError ?? (() => alert(msg)))(msg); return false }
        const cols = [...new Set(rows.flatMap(r => Object.keys(r)))]
        setColumns(cols)
        setDataRows(rows)
        setPreviewRowIndex(0)
        return true
      }

      // ── Generic XML: find repeating child elements ───────────────────────────
      const children = Array.from(root.children)
      if (!children.length) { const msg = 'XML root has no child elements.'; (onError ?? (() => alert(msg)))(msg); return false }

      const rows: DataRow[] = children.map(el => {
        const row: DataRow = {}
        // Attributes first
        for (const attr of Array.from(el.attributes)) row[attr.name] = attr.value
        // Child elements as fields
        for (const child of Array.from(el.children)) {
          row[child.tagName] = child.textContent ?? ''
        }
        // Fallback: element text content as "value"
        if (!Object.keys(row).length) row['value'] = el.textContent ?? ''
        return row
      })

      if (!rows.length) { const msg = 'No records found in XML.'; (onError ?? (() => alert(msg)))(msg); return false }
      const cols = Object.keys(rows[0])
      setColumns(cols)
      setDataRows(rows)
      setPreviewRowIndex(0)
      return true
    } catch {
      const msg = 'Failed to parse XML.'
      ;(onError ?? (() => alert(msg)))(msg)
      return false
    }
  }

  function openPicker() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls,.ods,.json,.xml'
    input.onchange = () => { if (input.files?.[0]) processFile(input.files[0]) }
    input.click()
  }

  // ─── Google Sheets import ──────────────────────────────────────────────────

  async function loadFromSheets() {
    const csvUrl = sheetsUrlToCsvUrl(sheetsUrl.trim())
    if (!csvUrl) {
      setSheetsError('Paste a Google Sheets share link or published CSV URL.')
      return
    }
    setSheetsLoading(true)
    setSheetsError(null)
    try {
      // Proxy through our Next.js route to avoid CORS
      const res = await fetch(`/api/sheets-proxy?url=${encodeURIComponent(csvUrl)}`)
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`)
      const text = await res.text()
      Papa.parse<DataRow>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (!result.data.length) {
            setSheetsError('Sheet is empty or has no header row.')
            return
          }
          setColumns(result.meta.fields ?? [])
          setDataRows(result.data)
          setPreviewRowIndex(0)
        },
      })
    } catch (err) {
      setSheetsError(err instanceof Error ? err.message : 'Failed to load sheet.')
    } finally {
      setSheetsLoading(false)
    }
  }

  // ─── JSON paste ────────────────────────────────────────────────────────────

  function loadFromJsonText() {
    setJsonError(null)
    try {
      const parsed = JSON.parse(jsonText.trim())
      const rows: DataRow[] = Array.isArray(parsed) ? parsed : parsed.data ?? parsed.records ?? parsed.rows ?? []
      if (!rows.length) { setJsonError('No rows found. Expected an array of objects.'); return }
      if (typeof rows[0] !== 'object') { setJsonError('Each array item must be an object (key/value pairs).'); return }
      const cols = Object.keys(rows[0])
      setColumns(cols)
      setDataRows(rows)
      setPreviewRowIndex(0)
    } catch {
      setJsonError('Invalid JSON. Check the syntax and try again.')
    }
  }

  // ─── XML paste ─────────────────────────────────────────────────────────────

  function loadFromXmlText() {
    setXmlError(null)
    parseXmlToRows(xmlText.trim(), msg => setXmlError(msg))
  }

  // ─── Shared render helpers ─────────────────────────────────────────────────

  const hasData = dataRows.length > 0

  return (
    <div className="w-72 bg-white border-l border-zinc-200 flex flex-col shrink-0 overflow-hidden">
      {/* Header + tabs */}
      <div className="px-4 pt-3 pb-0 border-b border-zinc-100">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Data Import</h3>
        <div className="flex gap-0">
          <TabBtn active={tab === 'file'} onClick={() => setTab('file')}>
            <Upload className="w-3 h-3" /> File
          </TabBtn>
          <TabBtn active={tab === 'json'} onClick={() => setTab('json')}>
            <Braces className="w-3 h-3" /> JSON
          </TabBtn>
          <TabBtn active={tab === 'xml'} onClick={() => setTab('xml')}>
            <FileCode className="w-3 h-3" /> XML
          </TabBtn>
          <TabBtn active={tab === 'sheets'} onClick={() => setTab('sheets')}>
            <Sheet className="w-3 h-3" /> Sheets
          </TabBtn>
        </div>
      </div>

      {/* File tab */}
      {tab === 'file' && (
        <div
          className={`m-3 rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-zinc-300 hover:border-zinc-400'}`}
          onPaste={e => {
            // Paste TSV/CSV from clipboard (e.g. copied from Excel)
            const text = e.clipboardData.getData('text/plain')
            if (text && text.includes('\t')) {
              e.preventDefault()
              Papa.parse<DataRow>(text, {
                header: true,
                delimiter: '\t',
                skipEmptyLines: true,
                complete: (result) => {
                  setColumns(result.meta.fields ?? [])
                  setDataRows(result.data)
                  setPreviewRowIndex(0)
                },
              })
            }
          }}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={openPicker}
        >
          <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-zinc-600">Drop CSV, Excel, or JSON</p>
          <p className="text-xs text-zinc-400 mt-0.5">or click to browse · paste from Excel</p>
        </div>
      )}

      {/* JSON tab */}
      {tab === 'json' && (
        <div className="m-3 space-y-3">
          <div>
            <label className="text-xs text-zinc-600 block mb-1 font-medium">Paste JSON or load .json file</label>
            <textarea
              className="w-full text-xs border border-zinc-300 rounded-lg px-2 py-2 resize-none font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={7}
              placeholder={`[\n  { "name": "Alice", "sku": "A001" },\n  { "name": "Bob", "sku": "B002" }\n]`}
              value={jsonText}
              onChange={e => { setJsonText(e.target.value); setJsonError(null) }}
            />
          </div>
          {jsonError && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{jsonError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadFromJsonText}
              disabled={!jsonText.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Braces className="w-3.5 h-3.5" />
              Load JSON
            </button>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.json'
                input.onchange = () => { if (input.files?.[0]) processFile(input.files[0]) }
                input.click()
              }}
              className="px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Browse…
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Expects an array of objects. Also supports <code className="bg-zinc-100 px-1 rounded">{"{ data: [...] }"}</code>.
          </p>
        </div>
      )}

      {/* XML tab */}
      {tab === 'xml' && (
        <div className="m-3 space-y-3">
          <div>
            <label className="text-xs text-zinc-600 block mb-1 font-medium">Paste XML or load .xml file</label>
            <textarea
              className="w-full text-xs border border-zinc-300 rounded-lg px-2 py-2 resize-none font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={7}
              placeholder={`<records>\n  <record>\n    <name>Alice</name>\n    <sku>A001</sku>\n  </record>\n</records>`}
              value={xmlText}
              onChange={e => { setXmlText(e.target.value); setXmlError(null) }}
            />
          </div>
          {xmlError && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{xmlError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadFromXmlText}
              disabled={!xmlText.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              Load XML
            </button>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.xml'
                input.onchange = () => { if (input.files?.[0]) processFile(input.files[0]) }
                input.click()
              }}
              className="px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Browse…
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Root element wraps repeating child elements. Each child becomes one data row; child tags become field names.
          </p>
        </div>
      )}

      {/* Google Sheets tab */}
      {tab === 'sheets' && (
        <div className="m-3 space-y-3">
          <div>
            <label className="text-xs text-zinc-600 block mb-1 font-medium">Spreadsheet URL</label>
            <textarea
              className="w-full text-xs border border-zinc-300 rounded-lg px-2 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              value={sheetsUrl}
              onChange={e => { setSheetsUrl(e.target.value); setSheetsError(null) }}
            />
            <p className="text-xs text-zinc-400 mt-0.5">
              The sheet must be shared as <strong>Anyone with the link can view</strong>.
            </p>
          </div>
          {sheetsError && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{sheetsError}</p>
          )}
          <button
            type="button"
            onClick={loadFromSheets}
            disabled={sheetsLoading || !sheetsUrl.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${sheetsLoading ? 'animate-spin' : ''}`} />
            {sheetsLoading ? 'Loading…' : hasData ? 'Refresh from Sheets' : 'Load Sheet'}
          </button>
          <p className="text-xs text-zinc-400">
            Tip: use <strong>Refresh</strong> to re-pull live data without re-pasting the URL.
          </p>
        </div>
      )}

      {/* Data preview (shared between tabs) */}
      {hasData && (
        <>
          <div className="px-4 py-2 border-y border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-zinc-500">{dataRows.length} records</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Previous row"
                aria-label="Previous row"
                onClick={() => setPreviewRowIndex(Math.max(0, previewRowIndex - 1))}
                disabled={previewRowIndex === 0}
                className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-zinc-600 min-w-[4rem] text-center">
                Row {previewRowIndex + 1} of {dataRows.length}
              </span>
              <button
                type="button"
                title="Next row"
                aria-label="Next row"
                onClick={() => setPreviewRowIndex(Math.min(dataRows.length - 1, previewRowIndex + 1))}
                disabled={previewRowIndex >= dataRows.length - 1}
                className="p-1 rounded hover:bg-zinc-100 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {columns.map(col => (
              <div key={col} className="rounded-lg bg-zinc-50 px-3 py-2">
                <p className="text-xs font-medium text-zinc-500">{col}</p>
                <p className="text-sm text-zinc-900 truncate">
                  {dataRows[previewRowIndex]?.[col] ?? '—'}
                </p>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-zinc-100">
            <p className="text-xs text-zinc-500 mb-2 font-medium">Merge tags</p>
            <div className="flex flex-wrap gap-1">
              {columns.map(col => (
                <code
                  key={col}
                  className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100"
                  onClick={() => navigator.clipboard.writeText(`{{${col}}}`)}
                  title="Click to copy"
                >
                  {`{{${col}}}`}
                </code>
              ))}
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">Click a tag to copy, paste into text elements</p>
          </div>
        </>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-600 text-blue-700'
          : 'border-transparent text-zinc-500 hover:text-zinc-700'
      }`}
    >
      {children}
    </button>
  )
}
