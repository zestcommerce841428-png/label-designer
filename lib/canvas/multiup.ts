/**
 * Multi-up / sheet printing — renders labels in an N×M grid on a page.
 * Useful for Avery label sheets (e.g. 5160 = 3 cols × 10 rows).
 *
 * Each label is rendered into an offscreen Fabric.js canvas at DPR×3,
 * then all labels on a sheet are tiled into a single PNG. Multiple sheets
 * are opened as separate pages in the print window.
 */

import { Canvas } from 'fabric'
import { applyMerge, resetToTemplates, type DataRow } from '@/lib/merge'
import { mmToPx } from '@/lib/label-sizes'
import { MAX_BATCH_ROWS } from '@/lib/constants'
import { expandRowsByQuantity } from '@/lib/canvas/batch'

export type MultiUpLayout = {
  cols: number
  rows: number
  marginTopMm: number
  marginLeftMm: number
  gapHMm: number    // horizontal gap between labels
  gapVMm: number    // vertical gap between labels
  pageWidthMm: number
  pageHeightMm: number
}

/** Common Avery / thermal sheet presets */
export const MULTIUP_PRESETS: { id: string; name: string; layout: MultiUpLayout }[] = [
  {
    id: 'single',
    name: 'Single (no sheet)',
    layout: { cols: 1, rows: 1, marginTopMm: 0, marginLeftMm: 0, gapHMm: 0, gapVMm: 0, pageWidthMm: 0, pageHeightMm: 0 },
  },
  {
    id: 'avery-5160',
    name: 'Avery 5160 (3×10, A4)',
    layout: { cols: 3, rows: 10, marginTopMm: 12.7, marginLeftMm: 4.8, gapHMm: 3.2, gapVMm: 0, pageWidthMm: 215.9, pageHeightMm: 279.4 },
  },
  {
    id: 'avery-5163',
    name: 'Avery 5163 (2×5, A4)',
    layout: { cols: 2, rows: 5, marginTopMm: 12.7, marginLeftMm: 4.8, gapHMm: 3.2, gapVMm: 0, pageWidthMm: 215.9, pageHeightMm: 279.4 },
  },
  {
    id: 'avery-5167',
    name: 'Avery 5167 (4×20, A4)',
    layout: { cols: 4, rows: 20, marginTopMm: 12.7, marginLeftMm: 4.8, gapHMm: 3.2, gapVMm: 0, pageWidthMm: 215.9, pageHeightMm: 279.4 },
  },
  {
    id: 'avery-l7160',
    name: 'Avery L7160 (3×7, A4)',
    layout: { cols: 3, rows: 7, marginTopMm: 15.1, marginLeftMm: 7.2, gapHMm: 2.5, gapVMm: 0, pageWidthMm: 210, pageHeightMm: 297 },
  },
  {
    id: '2x4',
    name: '2×4 Sheet',
    layout: { cols: 2, rows: 4, marginTopMm: 12, marginLeftMm: 10, gapHMm: 5, gapVMm: 5, pageWidthMm: 210, pageHeightMm: 297 },
  },
  {
    id: '3x3',
    name: '3×3 Sheet',
    layout: { cols: 3, rows: 3, marginTopMm: 10, marginLeftMm: 10, gapHMm: 5, gapVMm: 5, pageWidthMm: 210, pageHeightMm: 297 },
  },
]

export type MultiUpProgress = (current: number, total: number) => void

export async function multiUpPrint(
  templateJson: object,
  rows: DataRow[],
  labelWidthMm: number,
  labelHeightMm: number,
  labelName: string,
  layout: MultiUpLayout,
  onProgress?: MultiUpProgress,
): Promise<void> {
  // For single layout (no sheet), fall back to regular batch
  const labelsPerSheet = layout.cols * layout.rows
  const isSingle = labelsPerSheet <= 1

  const expanded = rows.length ? expandRowsByQuantity(rows) : [{}]
  const capped = expanded.slice(0, MAX_BATCH_ROWS)
  const total = Math.max(1, capped.length)

  const DPR = 3
  const labelW = mmToPx(labelWidthMm)
  const labelH = mmToPx(labelHeightMm)

  // ── Render all label PNGs ──────────────────────────────────────────────
  const labelPNGs: string[] = []
  for (let i = 0; i < total; i++) {
    onProgress?.(i + 1, total)
    const el = document.createElement('canvas')
    const c = new Canvas(el, { width: labelW * DPR, height: labelH * DPR, backgroundColor: '#ffffff' })
    c.setZoom(DPR)
    await c.loadFromJSON(templateJson)
    resetToTemplates(c)
    await applyMerge(c, capped[i] ?? {}, i, total)
    labelPNGs.push(c.toDataURL({ format: 'png', multiplier: 1 }))
    c.dispose()
  }

  // ── Build sheet HTML pages ─────────────────────────────────────────────
  let pages = ''
  const pageWidthMm  = isSingle ? labelWidthMm  : layout.pageWidthMm
  const pageHeightMm = isSingle ? labelHeightMm : layout.pageHeightMm

  if (isSingle) {
    pages = labelPNGs.map(url =>
      `<div class="page"><img src="${url}" style="width:${labelWidthMm}mm;height:${labelHeightMm}mm"/></div>`
    ).join('')
  } else {
    // Group labels into sheets
    for (let sheet = 0; sheet < labelPNGs.length; sheet += labelsPerSheet) {
      const sheetLabels = labelPNGs.slice(sheet, sheet + labelsPerSheet)
      let cells = ''
      for (let r = 0; r < layout.rows; r++) {
        for (let c = 0; c < layout.cols; c++) {
          const idx = r * layout.cols + c
          const url = sheetLabels[idx]
          const top  = layout.marginTopMm  + r * (labelHeightMm + layout.gapVMm)
          const left = layout.marginLeftMm + c * (labelWidthMm  + layout.gapHMm)
          cells += url
            ? `<img src="${url}" style="position:absolute;top:${top}mm;left:${left}mm;width:${labelWidthMm}mm;height:${labelHeightMm}mm"/>`
            : `<div style="position:absolute;top:${top}mm;left:${left}mm;width:${labelWidthMm}mm;height:${labelHeightMm}mm;border:1px dashed #eee"></div>`
        }
      }
      pages += `<div class="page" style="width:${pageWidthMm}mm;height:${pageHeightMm}mm;position:relative">${cells}</div>`
    }
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escHtml(labelName)}</title>
  <style>
    @page { margin: 0; size: ${pageWidthMm}mm ${pageHeightMm}mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    .page { page-break-after: always; overflow: hidden; }
    .page:last-child { page-break-after: avoid; }
  </style>
</head>
<body>${pages}</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.addEventListener('load', () => w.print())
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
