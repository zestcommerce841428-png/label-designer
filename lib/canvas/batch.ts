import { Canvas } from 'fabric'
import { applyMerge, resetToTemplates, type DataRow } from '@/lib/merge'
import { mmToPx } from '@/lib/label-sizes'
import { MAX_BATCH_ROWS } from '@/lib/constants'

export type BatchProgress = (current: number, total: number) => void

/**
 * Renders one label image per data row and opens a multi-page browser print
 * dialog. Falls back to a single copy if `rows` is empty.
 *
 * @param templateJson  Canvas JSON from `canvas.toObject(['customData','id'])`
 * @param rows          Data rows to merge (empty = print once with no merge)
 * @param widthMm       Label width in mm
 * @param heightMm      Label height in mm
 * @param labelName     Used in the print window title
 * @param onProgress    Optional callback for progress UI
 */
export async function batchPrint(
  templateJson: object,
  rows: DataRow[],
  widthMm: number,
  heightMm: number,
  labelName: string,
  onProgress?: BatchProgress,
): Promise<void> {
  const effectiveRows: DataRow[] = rows.length ? rows : [{}]
  const capped = effectiveRows.slice(0, MAX_BATCH_ROWS)

  const labelW = mmToPx(widthMm)
  const labelH = mmToPx(heightMm)
  const DPR = 3

  const dataURLs: string[] = []

  for (let i = 0; i < capped.length; i++) {
    onProgress?.(i + 1, capped.length)

    const el = document.createElement('canvas')
    const c = new Canvas(el, {
      width: labelW * DPR,
      height: labelH * DPR,
      backgroundColor: '#ffffff',
    })
    c.setZoom(DPR)

    await c.loadFromJSON(templateJson)
    // Reset conditional visibility before applying merge so every row starts fresh
    resetToTemplates(c)
    await applyMerge(c, capped[i], i)

    dataURLs.push(c.toDataURL({ format: 'png', multiplier: 1 }))
    c.dispose()
  }

  const pages = dataURLs
    .map(url => `<div class="page"><img src="${url}" /></div>`)
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Batch Print — ${escHtml(labelName)}</title>
  <style>
    @page { margin: 0; size: ${widthMm}mm ${heightMm}mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    .page { page-break-after: always; width: ${widthMm}mm; height: ${heightMm}mm; overflow: hidden; }
    .page:last-child { page-break-after: avoid; }
    img { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>${pages}</body>
</html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  // Wait for all images to decode before printing
  w.addEventListener('load', () => w.print())
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
