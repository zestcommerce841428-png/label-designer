/**
 * Batch PDF export — renders every data row as a canvas PNG and bundles them
 * into a single multi-page PDF using jsPDF.
 *
 * Each page is sized to the label dimensions so the PDF is print-ready at 1:1.
 * Pages are oriented to match the label (landscape if width > height).
 */

import type { Canvas } from 'fabric'
import type { DataRow } from '@/lib/merge'
import { applyMerge, resetToTemplates } from '@/lib/merge'

interface BatchPdfOptions {
  labelWidthMm: number
  labelHeightMm: number
  onProgress?: (current: number, total: number) => void
}

export async function exportBatchPdf(
  canvas: Canvas,
  rows: DataRow[],
  { labelWidthMm, labelHeightMm, onProgress }: BatchPdfOptions,
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf')

  const isLandscape = labelWidthMm > labelHeightMm
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [labelWidthMm, labelHeightMm],
  })

  for (let i = 0; i < rows.length; i++) {
    onProgress?.(i + 1, rows.length)

    await applyMerge(canvas, rows[i], i, rows.length)

    // Capture PNG from canvas
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 3 })

    if (i > 0) pdf.addPage([labelWidthMm, labelHeightMm], isLandscape ? 'landscape' : 'portrait')
    pdf.addImage(dataUrl, 'PNG', 0, 0, labelWidthMm, labelHeightMm)
  }

  // Restore templates
  resetToTemplates(canvas)
  canvas.renderAll()

  pdf.save('labels-batch.pdf')
}
