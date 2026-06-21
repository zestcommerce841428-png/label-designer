/**
 * CPCL export — Common Printer Command Language (Intermec / Honeywell printers)
 *
 * CPCL uses dots at 200 DPI (203 on some models; we use 200 for compatibility).
 * Origin is top-left. Units are dots.
 *
 * Minimal command set supported:
 *   ! 0 200 200 <height> 1   — job header
 *   TEXT 4 0 <x> <y> <text> — proportional text (font 4 = 12 cpi)
 *   BARCODE <type> ... <val> — 1D barcode
 *   QR-CODE ... <val>        — QR code
 *   BOX <x1> <y1> <x2> <y2> <thickness>
 *   LINE <x1> <y1> <x2> <y2> <thickness>
 *   PRINT                    — end job
 */

import type { Canvas } from 'fabric'
import type { AnyFabricObj } from '@/types/fabric-extensions'
import { mmToPx } from '@/lib/label-sizes'

const DPI = 200

function mmToDots(mm: number): number {
  return Math.round((mm / 25.4) * DPI)
}

function pxToDots(px: number, canvasWidthPx: number, labelWidthMm: number): number {
  const mmPerPx = labelWidthMm / canvasWidthPx
  return Math.round((px * mmPerPx / 25.4) * DPI)
}

/** CPCL barcode type map: bcid → CPCL barcode name */
const CPCL_BARCODE_MAP: Record<string, string> = {
  code128:          '128',
  code39:           '3/9',
  code93:           '93',
  interleaved2of5:  'I2OF5',
  codabar:          'CODABAR',
  ean13:            'EAN13',
  ean8:             'EAN8',
  upca:             'UPCA',
  upce:             'UPCE',
}

export function canvasToCpcl(
  canvas: Canvas,
  labelWidthMm: number,
  labelHeightMm: number,
): string {
  const heightDots = mmToDots(labelHeightMm)
  const canvasWidthPx  = mmToPx(labelWidthMm)
  const canvasHeightPx = mmToPx(labelHeightMm)

  function sx(px: number) { return pxToDots(px, canvasWidthPx, labelWidthMm) }
  function sy(px: number) { return pxToDots(px, canvasHeightPx, labelHeightMm) }

  // Header: offset-x=0, x-dpi=200, y-dpi=200, height, qty=1
  const lines: string[] = [`! 0 200 200 ${heightDots} 1`]

  const objects = canvas.getObjects() as AnyFabricObj[]

  for (const obj of objects) {
    if (!obj.visible) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any
    const x = sx(o.left ?? 0)
    const y = sy(o.top  ?? 0)

    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      const text = (o.text ?? '').replace(/\r?\n/g, ' ')
      const fontSize = o.fontSize ?? 14
      // CPCL font: 0(6pt) 1(8pt) 2(10pt) 3(12pt) 4(14pt) 5(24pt) 6(36pt) 7(48pt)
      const font = fontSize < 8 ? '0' : fontSize < 10 ? '1' : fontSize < 12 ? '2' : fontSize < 16 ? '3' : fontSize < 24 ? '4' : fontSize < 36 ? '5' : '6'
      const bold = o.fontWeight === 'bold' ? 'B' : ''
      lines.push(`${bold}TEXT ${font} 0 ${x} ${y} ${text}`)
    } else if (obj.type === 'rect') {
      const x2 = x + sx((o.width ?? 0) * (o.scaleX ?? 1))
      const y2 = y + sy((o.height ?? 0) * (o.scaleY ?? 1))
      const sw = Math.max(1, sx(o.strokeWidth ?? 1))
      lines.push(`BOX ${x} ${y} ${x2} ${y2} ${sw}`)
    } else if (obj.type === 'line') {
      const x2 = sx((o.x2 ?? 0) + (o.left ?? 0))
      const y2 = sy((o.y2 ?? 0) + (o.top ?? 0))
      const sw = Math.max(1, sx(o.strokeWidth ?? 1))
      lines.push(`LINE ${x} ${y} ${x2} ${y2} ${sw}`)
    } else if (obj.customData?.type === 'barcode') {
      const bType = (obj.customData.barcodeType as string) ?? 'code128'
      const value = (obj.customData.template as string ?? '').replace(/\r?\n/g, '')
      const bh = Math.max(20, sy((o.height ?? 0) * (o.scaleY ?? 1)))
      const bw = sx((o.width ?? 0) * (o.scaleX ?? 1))

      if (bType === 'qrcode' || bType === 'gs1qrcode') {
        // CPCL QR-CODE: QR-CODE <x> <y> M 2 U <size>\r<value>\r\nENDQR
        const cellSize = Math.max(2, Math.round(bw / 25))
        lines.push(`QR-CODE ${x} ${y} M 2 U ${cellSize}`)
        lines.push(value)
        lines.push('ENDQR')
      } else {
        const cpclCode = CPCL_BARCODE_MAP[bType]
        if (cpclCode) {
          // BARCODE <type> <narrow> <wide> <height> <x> <y> <HRI> <value>
          lines.push(`BARCODE ${cpclCode} 1 1 ${bh} ${x} ${y} 0 ${value}`)
        } else {
          lines.push(`; Barcode '${bType}' not supported in CPCL`)
        }
      }
    }
  }

  lines.push('PRINT')
  return lines.join('\r\n') + '\r\n'
}
