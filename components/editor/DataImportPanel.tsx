'use client'

import { useCallback, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Upload, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEditorStore, type DataRow } from '@/lib/store/editor'
import { MAX_IMPORT_FILE_BYTES } from '@/lib/constants'

export default function DataImportPanel() {
  const { dataRows, setDataRows, previewRowIndex, setPreviewRowIndex } = useEditorStore()
  const [columns, setColumns] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)

  const processFile = useCallback((file: File) => {
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      alert('File too large. Maximum size is 10 MB.')
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') {
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

  function openPicker() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = () => { if (input.files?.[0]) processFile(input.files[0]) }
    input.click()
  }

  return (
    <div className="w-72 bg-white border-l border-zinc-200 flex flex-col shrink-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-100">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data Import</h3>
      </div>

      <div
        className={`m-3 rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-zinc-300 hover:border-zinc-400'}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={openPicker}
      >
        <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-zinc-600">Drop CSV or Excel file</p>
        <p className="text-xs text-zinc-400 mt-0.5">or click to browse</p>
      </div>

      {dataRows.length > 0 && (
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
