/**
 * DPL export — Datamax Programming Language (Datamax-O'Neil / Honeywell printers)
 *
 * DPL uses 203 DPI (standard Datamax models). 1 mm ≈ 8 dots.
 * Commands are ASCII text terminated with CR+LF.
 *
 * Header block:
 *   STX L        — start-of-label
 *   D11          — label length (3 digits, in hundredths of an inch)
 *   191          — label width (3 digits, in hundredths of an inch)
 *   E            — quantity
 *   ...elements...
 *   E            — end-of-label
 *
 * Text element:
 *   1 <row> <col> <rotation> <font> <hMult> <wMult> <data>
 *
 * Barcode element:
 *   B <row> <col> <rotation> <type> <narrowBar> <wideBar> <height> <HRI> <data>
 *
 * Box element:
 *   Xc <row> <col> <length> <width> <thickness>
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

/** mm → hundredths of an inch (DPL header uses this unit) */
function mmToHundredths(mm: number): string {
  return String(Math.round((mm / 25.4) * 100)).padStart(3, '0')
}

/** DPL barcode type identifiers */
const DPL_BARCODE_MAP: Record<string, string> = {
  code128:          '1',   // Code 128
  code39:           '3',   // Code 39
  ean13:            'E',   // EAN-13
  ean8:             'E8',  // EAN-8
  upca:             'A',   // UPC-A
  upce:             'e',   // UPC-E
  interleaved2of5:  'I',   // I 2/5
  codabar:          'K',   // Codabar
  code93:           '9',   // Code 93
  code11:           '1a',  // Code 11
}

export function canvasToDpl(
  canvas: Canvas,
  labelWidthMm: number,
  labelHeightMm: number,
): string {
  const canvasWidthPx  = mmToPx(labelWidthMm)
  const canvasHeightPx = mmToPx(labelHeightMm)

  function sx(px: number) { return pxToDots(px, canvasWidthPx, labelWidthMm) }
  function sy(px: number) { return pxToDots(px, canvasHeightPx, labelHeightMm) }

  const labelWidthH  = mmToHundredths(labelWidthMm)
  const labelHeightH = mmToHundredths(labelHeightMm)

  const lines: string[] = [
    '\x02L',                            // STX L — start label
    `D${labelHeightH}`,                 // label length
    `191`,                              // print speed (default)
    `q${labelWidthH}`,                  // label width
    `N`,                                // cancel all fields
  ]

  const objects = canvas.getObjects() as AnyFabricObj[]

  for (const obj of objects) {
    if (!obj.visible) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = obj as any
    const col = sx(o.left ?? 0)
    const row = sy(o.top  ?? 0)

    if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      const text = (o.text ?? '').replace(/\r?\n/g, ' ')
      const fontSize = o.fontSize ?? 14
      // DPL font size: 0=6pt, 1=8pt, 2=10pt, 3=12pt, 4=14pt, 5=18pt, 6=24pt, 7=36pt
      const font = fontSize < 8 ? '0' : fontSize < 10 ? '1' : fontSize < 12 ? '2' : fontSize < 16 ? '3' : fontSize < 18 ? '4' : fontSize < 24 ? '5' : '6'
      // format: 1<row><col><rotation><font><hMult><wMult><data>\r\n
      lines.push(`1${String(row).padStart(4,'0')}${String(col).padStart(4,'0')}0${font}11${text}`)
    } else if (obj.type === 'rect') {
      const length = sx((o.width  ?? 0) * (o.scaleX ?? 1))
      const width  = sy((o.height ?? 0) * (o.scaleY ?? 1))
      const thickness = Math.max(1, sx(o.strokeWidth ?? 1))
      lines.push(`Xc${String(row).padStart(4,'0')}${String(col).padStart(4,'0')}${String(length).padStart(4,'0')}${String(width).padStart(4,'0')}${thickness}`)
    } else if (obj.customData?.type === 'barcode') {
      const bType = (obj.customData.barcodeType as string) ?? 'code128'
      const value = (obj.customData.template as string ?? '').replace(/\r?\n/g, '')
      const bh    = Math.max(20, sy((o.height ?? 0) * (o.scaleY ?? 1)))
      const dplCode = DPL_BARCODE_MAP[bType]
      if (dplCode) {
        // B<row><col><rotation><type><narrow><wide><height><hri><data>
        lines.push(`B${String(row).padStart(4,'0')}${String(col).padStart(4,'0')}0${dplCode}2 ${String(bh).padStart(3,'0')}B${value}`)
      } else if (bType === 'qrcode') {
        // DPL QR: 2D command
        lines.push(`2D${String(row).padStart(4,'0')}${String(col).padStart(4,'0')}0QR0300${value}`)
      } else {
        lines.push(`; Barcode '${bType}' not supported in DPL`)
      }
    }
  }

  lines.push('E')  // end-of-label
  return lines.join('\r\n') + '\r\n'
}
