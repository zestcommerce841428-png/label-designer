/**
 * AzureLabel .albl file importer
 *
 * .albl files are JSON documents. Key structure:
 *   commonPrintSettings.width/height  — label size in mm
 *   designs[0].elements               — array of elements
 *
 * Element types:
 *   0 = text (may include barcode subtype via barcode.type != 0/-1)
 *   3 = rectangle/shape
 *   6 = barcode/2D code
 *
 * Field syntax:
 *   #formula#[FieldName]              → {{FieldName}}
 *   #formula#[Field] Format('...')    → {{= fmt(row.Field, '...') }}
 *   #textWithFormulas#text {[Field]}  → text {{Field}}
 *
 * Barcode type mapping (barcode.type numeric IDs):
 *   13 = EAN-13        20 = Code 128      34 = UPC-A
 *   58 = QR Code       71 = Data Matrix   55 = PDF417
 *   35 = UPC-E         6  = EAN-8         4  = Code 39
 *   18 = Code 93       19 = Codabar       5  = I 2of5
 *
 * Font size in AzureLabel is stored in mm. Convert: mm × 2.834 = pt
 */

import { mmToPx } from '@/lib/label-sizes'

type AlblElement = {
  type: number          // 0=text, 3=shape, 6=barcode
  left: number          // mm
  top: number           // mm
  width: number         // mm
  height: number        // mm
  angle?: number
  text?: string
  font?: {
    name?: string
    size?: number       // mm
    color1?: string
    bold?: boolean
    italic?: boolean
    underline?: boolean
  }
  textOptions?: {
    alignment?: number  // 0=left,1=right,2=center
    opacity?: number
    wrapCharacters?: string
  }
  brush?: { color1?: string; type?: number }
  border?: { width?: number; color1?: string }
  barcode?: { type: number; showText?: boolean }
}

type AlblFile = {
  AzureLabel?: string
  commonPrintSettings?: { width?: number; height?: number }
  designs?: Array<{ elements?: AlblElement[]; printSettings?: { width?: number; height?: number } }>
}

/** AzureLabel numeric barcode type → bwip-js bcid */
const AL_BARCODE_MAP: Record<number, string> = {
  4:  'code39',
  5:  'interleaved2of5',
  6:  'ean8',
  13: 'ean13',
  18: 'code93',
  19: 'codabar',
  20: 'code128',
  34: 'upca',
  35: 'upce',
  55: 'pdf417',
  58: 'qrcode',
  71: 'datamatrix',
  72: 'azteccode',
  68: 'datamatrix',   // GS1 DataMatrix variant
}

const AL_ALIGN_MAP: Record<number, string> = { 0: 'left', 1: 'right', 2: 'center' }

/** mm → CSS points (Fabric uses CSS px based on 96dpi; font size in 'pt' units) */
function mmToPt(mm: number): number {
  return Math.round(mm * 2.834)
}

/** Convert AzureLabel formula text to LabelForge merge syntax */
function convertText(raw: string | undefined): string {
  if (!raw) return ''
  let t = raw

  // #textWithFormulas# uses ${[Field]} or {[Field]}
  if (t.startsWith('#textWithFormulas#')) {
    t = t.slice('#textWithFormulas#'.length)
    // Convert ${[Field]} and {[Field]} and [Field] to {{Field}}
    t = t.replace(/\$\{\[([^\]]+)\]\}/g, '{{$1}}')
    t = t.replace(/\{?\[([^\]]+)\]\}?/g, '{{$1}}')
    return t
  }

  // #formula#[Field] Format('pattern')
  if (t.startsWith('#formula#')) {
    t = t.slice('#formula#'.length).trim()
    // [Field] Format('pattern') → {{= fmt(row.Field, 'pattern') }}
    const fmtMatch = t.match(/^\[([^\]]+)\]\s+Format\('([^']+)'\)$/)
    if (fmtMatch) return `{{= fmt(row.${fmtMatch[1]}, '${fmtMatch[2]}') }}`
    // Simple [Field]
    const fieldMatch = t.match(/^\[([^\]]+)\]$/)
    if (fieldMatch) return `{{${fieldMatch[1]}}}`
    // Fallback — strip brackets
    return t.replace(/\[([^\]]+)\]/g, '{{$1}}')
  }

  return t
}

/**
 * Parse an .albl JSON string and return a Fabric canvas JSON object
 * plus the label dimensions (mm).
 */
export function parseAlbl(json: string): {
  canvasJson: object
  widthMm: number
  heightMm: number
} | null {
  let file: AlblFile
  try {
    file = JSON.parse(json)
  } catch {
    return null
  }

  if (!file.AzureLabel) return null

  const settings = file.commonPrintSettings ?? file.designs?.[0]?.printSettings
  const widthMm  = settings?.width  ?? 100
  const heightMm = settings?.height ?? 50

  const elements = file.designs?.[0]?.elements ?? []
  const objects: object[] = []

  for (const el of elements) {
    const left = mmToPx(el.left ?? 0)
    const top  = mmToPx(el.top  ?? 0)
    const w    = mmToPx(el.width  ?? 10)
    const h    = mmToPx(el.height ?? 10)

    const fontSize   = mmToPt(el.font?.size ?? 4)
    const fontFamily = el.font?.name ?? 'Arial'
    const fill       = el.font?.color1 ?? '#000000'
    const angle      = el.angle ?? 0
    const textVal    = convertText(el.text)

    // Shape (type 3) — rectangle
    if (el.type === 3) {
      const brushColor  = el.brush?.type === 0 ? 'transparent' : (el.brush?.color1 ?? 'transparent')
      const strokeColor = (el.border?.width ?? 0) > 0 ? (el.border?.color1 ?? '#000000') : '#000000'
      const strokeWidth = mmToPx(el.border?.width ?? 1)
      objects.push({
        type: 'rect', left, top, width: w, height: h, angle,
        fill: brushColor,
        stroke: strokeColor,
        strokeWidth,
        selectable: true, evented: true,
      })
      continue
    }

    // Barcode (type 6)
    if (el.type === 6) {
      const bcId = el.barcode?.type ?? 58
      const bcType = AL_BARCODE_MAP[bcId] ?? 'qrcode'
      // We can't render barcode images here (no canvas); output a placeholder text
      objects.push({
        type: 'i-text', left, top, angle,
        text: `[${bcType.toUpperCase()} barcode: ${textVal}]`,
        fontSize: Math.max(8, fontSize),
        fontFamily,
        fill: '#374151',
        customData: {
          type: 'barcode',
          barcodeType: bcType,
          template: textVal,
          _alblPlaceholder: true,
        },
      })
      continue
    }

    // Text (type 0 or anything else)
    const textAlign = AL_ALIGN_MAP[el.textOptions?.alignment ?? 0] ?? 'left'
    const opacity   = (el.textOptions?.opacity ?? 100) / 100
    const wrapping  = el.textOptions?.wrapCharacters

    objects.push({
      type: wrapping ? 'textbox' : 'i-text',
      left, top, width: wrapping ? w : undefined, angle,
      text: textVal,
      fontSize: Math.max(6, fontSize),
      fontFamily,
      fill,
      fontWeight:     el.font?.bold      ? 'bold' : 'normal',
      fontStyle:      el.font?.italic    ? 'italic' : 'normal',
      underline:      el.font?.underline ?? false,
      textAlign,
      opacity,
      customData: {
        template: textVal,
      },
    })
  }

  return {
    canvasJson: { version: '5.3.0', objects },
    widthMm,
    heightMm,
  }
}
