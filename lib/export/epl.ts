/**
 * EPL2 export — converts a Fabric.js canvas snapshot to an EPL2 string
 * suitable for legacy Zebra printers (LP2844, TLP2742, etc.)
 *
 * EPL2 uses dots at 203 dpi. 1 mm ≈ 8 dots.
 * Units: X/Y origin is top-left, in dots.
 *
 * Supported elements:
 *   IText / Textbox → A command (ASCII font)
 *   Rect            → X command (box)
 *   Line            → LE/LO (line) command — simplified as filled box
 *   FabricImage (barcode) → B command for supported types; ^ comment otherwise
 */

import type { Canvas } from 'fabric'
import type { AnyFabricObj } from '@/types/fabric-extensions'
import { mmToPx } from '@/lib/label-sizes'

const DPI = 203

function mmToDots(mm: number): number {
  return Math.round((mm / 25.4) * DPI)
}

function pxToDots(px: number, canvasWidthPx: number, labelWidthMm: number): number {
  const mmPerPx = labelWidthMm / canvasWidthPx
  return Math.round((px * mmPerPx / 25.4) * DPI)
}

/** EPL2 barcode type map */
const EPL_BARCODE_MAP: Record<string, string> = {
  code128: '1',
  code39:  '3',
  ean13:   'E',
  ean8:    'F',
  upca:    'U',
  upce:    '9',
  codabar: 'K',
  interleaved2of5: '2',
  code93:  'M',
}

export function canvasToEpl(
  canvas: Canvas,
  labelWidthMm: number,
  labelHeightMm: number,
): string {
  const widthDots  = mmToDots(labelWidthMm)
  const heightDots = mmToDots(labelHeightMm)
  const canvasWidthPx  = mmToPx(labelWidthMm)
  const canvasHeightPx = mmToPx(labelHeightMm)

  function scaleX(px: number) { return pxToDots(px, canvasWidthPx, labelWidthMm) }
  function scaleY(px: number) { return pxToDots(px, canvasHeightPx, labelHeightMm) }

  const lines: string[] = [
    'N',                               // Clear image buffer
    `q${widthDots}`,                   // Set label width
    `Q${heightDots},0`,               // Set label length, gap
  ]

  const objects = canvas.getObjects() as AnyFabricObj[]

  for (const obj of objects) {
    if (!obj.visible) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any
    const x = scaleX(o.left ?? 0)
    const y = scaleY(o.top  ?? 0)

    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      const text = (o.text ?? '').replace(/\r?\n/g, ' ')
      const fontSize = o.fontSize ?? 16
      // EPL font: 1=6pt, 2=7pt, 3=10pt, 4=12pt, 5=24pt
      const font = fontSize < 8 ? '1' : fontSize < 12 ? '2' : fontSize < 16 ? '3' : fontSize < 22 ? '4' : '5'
      const bold = o.fontWeight === 'bold' ? 'B' : 'N'
      lines.push(`A${x},${y},0,${font},1,1,${bold},"${text.replace(/"/g, "'")}"`)
    } else if (obj.type === 'rect') {
      const w = scaleX((o.width ?? 0) * (o.scaleX ?? 1))
      const h = scaleY((o.height ?? 0) * (o.scaleY ?? 1))
      const sw = Math.max(1, scaleX(o.strokeWidth ?? 1))
      lines.push(`X${x},${y},${sw},${x + w},${y + h}`)
    } else if (obj.type === 'line') {
      const x2 = scaleX((o.x2 ?? 0) + (o.left ?? 0))
      const y2 = scaleY((o.y2 ?? 0) + (o.top ?? 0))
      const sw = Math.max(1, scaleX(o.strokeWidth ?? 1))
      // Draw as a thin box
      lines.push(`X${x},${y},${sw},${x2},${y2}`)
    } else if (obj.customData?.type === 'barcode') {
      const bType = obj.customData.barcodeType as string ?? 'code128'
      const eplCode = EPL_BARCODE_MAP[bType]
      const value = (obj.customData.template as string ?? '').replace(/"/g, "'")
      const bh = Math.max(20, scaleY((o.height ?? 0) * (o.scaleY ?? 1)))
      if (eplCode) {
        lines.push(`B${x},${y},0,${eplCode},2,2,${bh},B,"${value}"`)
      } else {
        lines.push(`; Barcode type '${bType}' not supported in EPL2`)
      }
    }
  }

  lines.push('P1')  // Print one label
  return lines.join('\r\n') + '\r\n'
}
