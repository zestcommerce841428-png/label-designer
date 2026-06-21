/**
 * ZPL II export — converts a Fabric.js canvas snapshot to a ZPL string
 * suitable for Zebra (ZPL II) printers.
 *
 * Supported elements:
 *   IText / Textbox → ^FO + ^A (scalable font)
 *   Rect            → ^FO + ^GB (graphic box)
 *   Circle / Ellipse → ^FO + ^GE (graphic ellipse)
 *   Line            → ^FO + ^GD (graphic diagonal) for non-axis lines; ^GB for axis-aligned
 *   FabricImage (barcode) → ^FO + ^BQ/^BC/^BE etc. when barcodeType is known;
 *                           falls back to a placeholder comment
 *
 * Units: ZPL uses dots. Standard 203 dpi ⟹ 1 mm = ~8 dots; 300 dpi ⟹ ~12 dots.
 * We expose DPI as a parameter so the caller can match their printer.
 */

import type { Canvas, FabricObject } from 'fabric'
import type { AnyFabricObj } from '@/types/fabric-extensions'
import { mmToPx } from '@/lib/label-sizes'

type ZplOptions = {
  dpi?: 203 | 300 | 600
}

/** Convert mm → ZPL dots */
function mmToDots(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi)
}

/** Convert canvas-px → ZPL dots, accounting for canvas scale */
function pxToDots(px: number, canvasWidthPx: number, labelWidthMm: number, dpi: number): number {
  const mmPerPx = labelWidthMm / canvasWidthPx
  return Math.round((px * mmPerPx / 25.4) * dpi)
}

/** Escape ^FD field data — caret and tilde must be escaped */
function fdEscape(s: string): string {
  return s.replace(/\^/g, '\\^').replace(/~/g, '\\~')
}

/** Map a bwip-js bcid → ZPL barcode command prefix */
const ZPL_BARCODE_MAP: Record<string, string> = {
  qrcode:      '^BQN,2,',   // ^BQN = QR normal; append magnification factor
  code128:     '^BCN,',     // ^BCN = Code 128 normal; append height
  code39:      '^B3N,N,',   // ^B3N = Code 39
  ean13:       '^BEN,',     // ^BE = EAN-13
  ean8:        '^B8N,',     // ^B8 = EAN-8
  upca:        '^BUN,',     // ^BU = UPC-A
  upce:        '^B9N,',     // ^B9 = UPC-E
  datamatrix:  '^BXN,',     // ^BX = Data Matrix
  pdf417:      '^B7N,',     // ^B7 = PDF417
  'gs1-128':   '^BCN,',
  interleaved2of5: '^BIN,', // ^BI = Interleaved 2 of 5
  codabar:     '^BKN,',     // ^BK = Codabar
}

export function canvasToZpl(
  canvas: Canvas,
  labelWidthMm: number,
  labelHeightMm: number,
  opts: ZplOptions = {}
): string {
  const dpi = opts.dpi ?? 203
  const widthDots  = mmToDots(labelWidthMm,  dpi)
  const heightDots = mmToDots(labelHeightMm, dpi)

  // Canvas logical width (before any zoom/viewport)
  const canvasWidthPx  = mmToPx(labelWidthMm)
  const canvasHeightPx = mmToPx(labelHeightMm)

  function scaleX(px: number) { return pxToDots(px, canvasWidthPx, labelWidthMm, dpi) }
  function scaleY(px: number) { return pxToDots(px, canvasHeightPx, labelHeightMm, dpi) }

  const lines: string[] = [
    '^XA',                          // Start label
    `^PW${widthDots}`,              // Print width
    `^LL${heightDots}`,             // Label length
    '^LH0,0',                       // Label home
    '^CI28',                        // UTF-8 character set
  ]

  const objects = canvas.getObjects() as AnyFabricObj[]

  for (const obj of objects) {
    if (!obj.visible) continue

    // Absolute position (accounting for group nesting would need more work,
    // but most LabelForge labels are flat)
    const left   = scaleX(obj.left ?? 0)
    const top    = scaleY(obj.top  ?? 0)
    const width  = scaleX((obj.width  ?? 50) * (obj.scaleX ?? 1))
    const height = scaleY((obj.height ?? 20) * (obj.scaleY ?? 1))

    // ── Text ────────────────────────────────────────────────────────────────
    if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = obj as any
      const text = fdEscape(String(t.text ?? ''))
      if (!text.trim()) continue

      const fontHeight = scaleY(t.fontSize ?? 16)
      const bold = t.fontWeight === 'bold' ? 'B' : 'N'
      // ^A0 = scalable font 0 (built-in), orientation N, height, width
      lines.push(`^FO${left},${top}`)
      lines.push(`^A0N,${fontHeight},${Math.round(fontHeight * 0.6)}`)
      lines.push(`^FD${text}^FS`)
      continue
    }

    // ── Barcode image ────────────────────────────────────────────────────────
    if (obj.customData?.type === 'barcode') {
      const bcid    = obj.customData.barcodeType ?? 'code128'
      const value   = fdEscape(obj.customData.template ?? '')
      const zplCmd  = ZPL_BARCODE_MAP[bcid]

      lines.push(`^FO${left},${top}`)

      if (zplCmd) {
        if (bcid === 'qrcode') {
          // ^BQ: magnification 1-10; height not applicable
          const mag = Math.max(1, Math.min(10, Math.round(height / 10)))
          lines.push(`^BQN,2,${mag}`)
          lines.push(`^FDQA,${value}^FS`)
        } else if (bcid === 'datamatrix') {
          lines.push(`^BXN,${Math.max(1, Math.round(height / 5))},200`)
          lines.push(`^FD${value}^FS`)
        } else if (bcid === 'pdf417') {
          lines.push(`^B7N,${height},4,0,1,N`)
          lines.push(`^FD${value}^FS`)
        } else {
          lines.push(`${zplCmd}${height},N,N,N`)
          lines.push(`^FD${value}^FS`)
        }
      } else {
        // Unsupported barcode — emit a comment + text fallback
        lines.push(`^A0N,20,12^FD[${bcid}: ${value}]^FS`)
      }
      continue
    }

    // ── Rectangle ───────────────────────────────────────────────────────────
    if (obj.type === 'rect') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = obj as any
      const stroke = scaleX(r.strokeWidth ?? 1)
      // ^GB width, height, border-thickness
      lines.push(`^FO${left},${top}^GB${width},${height},${Math.max(1, stroke)}^FS`)
      continue
    }

    // ── Circle / Ellipse ───────────────────────────────────────────────────
    if (obj.type === 'circle' || obj.type === 'ellipse') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = obj as any
      const stroke = scaleX(c.strokeWidth ?? 1)
      // ^GE width, height, thickness
      lines.push(`^FO${left},${top}^GE${width},${height},${Math.max(1, stroke)}^FS`)
      continue
    }

    // ── Line ────────────────────────────────────────────────────────────────
    if (obj.type === 'line') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const l = obj as any
      const stroke = scaleX(l.strokeWidth ?? 1)
      const x1 = scaleX(l.x1 ?? 0)
      const y1 = scaleY(l.y1 ?? 0)
      const x2 = scaleX(l.x2 ?? 0)
      const y2 = scaleY(l.y2 ?? 0)
      const w  = Math.abs(x2 - x1) || 1
      const h  = Math.abs(y2 - y1) || 1

      if (y1 === y2) {
        // Horizontal — use ^GB
        lines.push(`^FO${Math.min(x1,x2)},${y1}^GB${w},${stroke},${stroke}^FS`)
      } else if (x1 === x2) {
        // Vertical — use ^GB
        lines.push(`^FO${x1},${Math.min(y1,y2)}^GB${stroke},${h},${stroke}^FS`)
      } else {
        // Diagonal — use ^GD (right/left diagonal)
        const dir = (x2 > x1) === (y2 > y1) ? 'R' : 'L'
        lines.push(`^FO${Math.min(x1,x2)},${Math.min(y1,y2)}^GD${w},${h},${stroke},,${dir}^FS`)
      }
      continue
    }
  }

  lines.push('^XZ') // End label
  return lines.join('\n')
}

/** Generate a TSPL label (for TSC printers) */
export function canvasToTspl(
  canvas: Canvas,
  labelWidthMm: number,
  labelHeightMm: number,
  opts: { dpi?: 203 | 300 } = {}
): string {
  const dpi = opts.dpi ?? 203
  const dotsPerMm = dpi / 25.4

  const widthDots  = Math.round(labelWidthMm  * dotsPerMm)
  const heightDots = Math.round(labelHeightMm * dotsPerMm)

  const canvasWidthPx  = mmToPx(labelWidthMm)
  const canvasHeightPx = mmToPx(labelHeightMm)

  function scaleX(px: number) {
    return Math.round(px * (labelWidthMm  / canvasWidthPx)  * dotsPerMm)
  }
  function scaleY(px: number) {
    return Math.round(px * (labelHeightMm / canvasHeightPx) * dotsPerMm)
  }

  const lines: string[] = [
    `SIZE ${labelWidthMm} mm, ${labelHeightMm} mm`,
    `GAP 2 mm, 0 mm`,
    `DIRECTION 0`,
    `CLS`,
  ]

  const objects = canvas.getObjects() as AnyFabricObj[]

  for (const obj of objects) {
    if (!obj.visible) continue

    const left   = scaleX(obj.left ?? 0)
    const top    = scaleY(obj.top  ?? 0)
    const width  = scaleX((obj.width  ?? 50) * (obj.scaleX ?? 1))
    const height = scaleY((obj.height ?? 20) * (obj.scaleY ?? 1))

    if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = obj as any
      const text = String(t.text ?? '').replace(/"/g, '\\"')
      if (!text.trim()) continue
      const fontPt = Math.max(8, Math.round((t.fontSize ?? 16) * (labelWidthMm / canvasWidthPx) * dotsPerMm / 2))
      lines.push(`TEXT ${left},${top},"ARIAL.TTF",0,${fontPt},${fontPt},"${text}"`)
      continue
    }

    if (obj.customData?.type === 'barcode') {
      const bcid  = obj.customData.barcodeType ?? 'code128'
      const value = String(obj.customData.template ?? '').replace(/"/g, '\\"')
      if (bcid === 'qrcode') {
        const cell = Math.max(3, Math.round(height / 30))
        lines.push(`QRCODE ${left},${top},ECC_M,${cell},A,0,"${value}"`)
      } else if (bcid === 'datamatrix') {
        lines.push(`DMATRIX ${left},${top},0,0,${height},0,"${value}"`)
      } else {
        // Map common types; default to 128
        const tsplType = bcid === 'ean13' ? 'EAN13' :
                         bcid === 'ean8'  ? 'EAN8'  :
                         bcid === 'upca'  ? 'UPC-A' :
                         bcid === 'code39' ? '39'   : '128'
        lines.push(`BARCODE ${left},${top},"${tsplType}",${height},1,0,2,2,"${value}"`)
      }
      continue
    }

    if (obj.type === 'rect') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sw = scaleX((obj as any).strokeWidth ?? 1)
      lines.push(`BOX ${left},${top},${left + width},${top + height},${Math.max(1, sw)}`)
      continue
    }
  }

  lines.push('PRINT 1,1')
  return lines.join('\n')
}
