import { IText, FabricImage, type Canvas, type FabricObject } from 'fabric'
import { generateBarcodeDataURL } from '@/lib/barcode'

export type DataRow = Record<string, string>

type WithCustomData = FabricObject & {
  customData?: {
    template?: string
    condition?: string
    type?: string
    barcodeType?: string
  }
  id?: string
}

// ---------------------------------------------------------------------------
// Built-in helpers exposed inside {{= }} formula expressions
// ---------------------------------------------------------------------------

/**
 * Excel-style number/date formatter available as `fmt(value, pattern)` inside
 * formula fields.
 *
 * Examples:
 *   {{= fmt(row.price, '#,##0.00') }}  →  "1,234.56"
 *   {{= fmt(row.price, '$#,##0.00') }} →  "$1,234.56"
 *   {{= fmt(row.date,  'dd/MM/yyyy') }} →  "21/06/2026"
 *   {{= fmt(row.price, '0%') }}         →  "75%"
 */
function fmt(value: unknown, pattern: string): string {
  if (value === null || value === undefined || value === '') return ''

  // Date pattern detection
  if (/[dMyH]/.test(pattern) && !/[#0]/.test(pattern)) {
    const d = value instanceof Date ? value : new Date(String(value))
    if (!isNaN(d.getTime())) {
      return pattern
        .replace('yyyy', String(d.getFullYear()))
        .replace('yy',   String(d.getFullYear()).slice(-2))
        .replace('MM',   String(d.getMonth() + 1).padStart(2, '0'))
        .replace('M',    String(d.getMonth() + 1))
        .replace('dd',   String(d.getDate()).padStart(2, '0'))
        .replace('d',    String(d.getDate()))
        .replace('HH',   String(d.getHours()).padStart(2, '0'))
        .replace('mm',   String(d.getMinutes()).padStart(2, '0'))
        .replace('ss',   String(d.getSeconds()).padStart(2, '0'))
    }
  }

  const num = parseFloat(String(value))
  if (isNaN(num)) return String(value)

  // Percentage
  if (pattern.endsWith('%')) {
    const decimals = (pattern.match(/0\.(0+)/) ?? [])[1]?.length ?? 0
    return (num * (pattern.includes('0%') && num <= 1 ? 100 : 1)).toFixed(decimals) + '%'
  }

  // Detect decimal places from pattern
  const decPart = (pattern.match(/\.(0+)/) ?? [])[1]
  const decimals = decPart?.length ?? 0

  // Group separator
  const useGroup = pattern.includes(',')

  // Currency prefix
  const currencyMatch = pattern.match(/^([^#0]+)/)
  const prefix = currencyMatch ? currencyMatch[1].replace(/[#,0.]/g, '') : ''

  let formatted = num.toFixed(decimals)
  if (useGroup) {
    const [intPart, fracPart] = formatted.split('.')
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    formatted = fracPart !== undefined ? `${grouped}.${fracPart}` : grouped
  }

  return prefix + formatted
}

// ---------------------------------------------------------------------------
// Template resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a template string against a data row.
 *
 * Supported syntax:
 *   {{field}}              — simple field substitution
 *   {{=row.price * 1.1}}   — JavaScript formula; `row`, `rowIndex`, `fmt` are in scope
 *   {{#counter}}           — auto-increment starting at 1 (step 1, no padding)
 *   {{#counter:5:2:4}}     — start=5, step=2, pad to 4 digits → "0005", "0007", …
 *
 * Formula scope extras:
 *   fmt(value, pattern)    — Excel-style number/date formatting
 *   fmt(row.price, '#,##0.00') → "1,234.56"
 */
export function resolveTemplate(template: string, row: DataRow, rowIndex: number): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, inner: string) => {
    const t = inner.trim()

    if (t.startsWith('=')) {
      return evalFormula(t.slice(1).trim(), row, rowIndex)
    }

    if (t.startsWith('#counter')) {
      const parts = t.split(':')
      const start = parseInt(parts[1] ?? '1', 10)
      const step  = parseInt(parts[2] ?? '1', 10)
      const pad   = parseInt(parts[3] ?? '0', 10)
      const value = start + rowIndex * step
      return pad > 0 ? String(value).padStart(pad, '0') : String(value)
    }

    return row[t] ?? ''
  })
}

function evalFormula(expr: string, row: DataRow, rowIndex: number): string {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('row', 'rowIndex', 'fmt', `"use strict"; return String(${expr})`)
    return fn(row, rowIndex, fmt) as string
  } catch {
    return '#ERR'
  }
}

function evalCondition(condition: string, row: DataRow, rowIndex: number): boolean {
  if (!condition.trim()) return true
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('row', 'rowIndex', `"use strict"; return !!(${condition})`)
    return fn(row, rowIndex) as boolean
  } catch {
    return true
  }
}

// ---------------------------------------------------------------------------
// Canvas-level merge
// ---------------------------------------------------------------------------

const URL_RE = /^https?:\/\//i

/**
 * Applies a data row to all objects on the canvas:
 *   - Sets visibility based on `customData.condition`
 *   - Resolves `customData.template` into the rendered text / barcode / image
 *
 * Dynamic image: if a FabricImage has a template that resolves to a URL,
 * its src is updated (works for product photos stored in a CSV column).
 */
export async function applyMerge(canvas: Canvas, row: DataRow, rowIndex: number): Promise<void> {
  const objects = canvas.getObjects() as WithCustomData[]

  for (const obj of objects) {
    const cd = obj.customData

    // Conditional visibility
    if (cd?.condition) {
      obj.set({ visible: evalCondition(cd.condition, row, rowIndex) })
    }

    if (!cd?.template) continue

    const resolved = resolveTemplate(cd.template, row, rowIndex)

    if (obj.type === 'i-text' || obj.type === 'text') {
      ;(obj as IText).set({ text: resolved })
    } else if (cd.type === 'barcode') {
      try {
        const dataURL = await generateBarcodeDataURL(resolved, (cd.barcodeType ?? 'qrcode') as 'qrcode')
        await (obj as FabricImage).setSrc(dataURL)
      } catch {
        // Invalid barcode value — leave previous image intact
      }
    } else if (obj instanceof FabricImage && URL_RE.test(resolved)) {
      // Dynamic image from URL field — e.g. {{product_image}} → https://...
      try {
        await (obj as FabricImage).setSrc(resolved, { crossOrigin: 'anonymous' })
      } catch {
        // Network failure or CORS — silently skip
      }
    }
  }

  canvas.renderAll()
}

/**
 * Resets all template-bearing text objects to show their raw template string.
 * Call before serialising the canvas so saved JSON contains `{{field}}`
 * placeholders rather than last-previewed values.
 */
export function resetToTemplates(canvas: Canvas): void {
  const objects = canvas.getObjects() as WithCustomData[]
  for (const obj of objects) {
    const template = obj.customData?.template
    if (!template) continue
    if (obj.type === 'i-text' || obj.type === 'text') {
      ;(obj as IText).set({ text: template })
    }
    obj.set({ visible: true })
  }
}
