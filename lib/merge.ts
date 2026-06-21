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
// Built-in formula helpers — available inside {{= }} expressions
// ---------------------------------------------------------------------------

/**
 * Excel-style number/date formatter.
 * fmt(row.price, "#,##0.00")  →  "1,234.56"
 * fmt(row.date,  "dd/MM/yyyy") →  "21/06/2026"
 * fmt(row.price, "$#,##0")    →  "$1,235"
 * fmt(row.ratio, "0%")        →  "75%"
 */
function fmt(value: unknown, pattern: string): string {
  if (value === null || value === undefined || value === '') return ''
  // Date pattern
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
  if (pattern.endsWith('%')) {
    const decimals = (pattern.match(/0\.(0+)/) ?? [])[1]?.length ?? 0
    return (num * (pattern.includes('0%') && num <= 1 ? 100 : 1)).toFixed(decimals) + '%'
  }
  const decPart = (pattern.match(/\.(0+)/) ?? [])[1]
  const decimals = decPart?.length ?? 0
  const useGroup = pattern.includes(',')
  const currencyMatch = pattern.match(/^([^#0,]+)/)
  const prefix = currencyMatch ? currencyMatch[1].replace(/[#,0.]/g, '') : ''
  let formatted = num.toFixed(decimals)
  if (useGroup) {
    const [intPart, fracPart] = formatted.split('.')
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    formatted = fracPart !== undefined ? `${grouped}.${fracPart}` : grouped
  }
  return prefix + formatted
}

/** Conditional: If(condition, trueValue, falseValue) */
function If<T>(cond: unknown, a: T, b: T): T { return cond ? a : b }

/** String helpers */
function Left(s: string, n: number)  { return String(s ?? '').slice(0, n) }
function Right(s: string, n: number) { const str = String(s ?? ''); return str.slice(Math.max(0, str.length - n)) }
function Mid(s: string, start: number, len?: number) {
  const str = String(s ?? ''); return len !== undefined ? str.slice(start - 1, start - 1 + len) : str.slice(start - 1)
}
function Trim(s: string) { return String(s ?? '').trim() }
function Upper(s: string) { return String(s ?? '').toUpperCase() }
function Lower(s: string) { return String(s ?? '').toLowerCase() }
function Len(s: string)   { return String(s ?? '').length }
function Replace(s: string, find: string, rep: string) { return String(s ?? '').split(find).join(rep) }
function Pad(s: string, width: number, char = ' ', align: 'L'|'R'|'C' = 'R') {
  const str = String(s ?? '')
  const pad = char.repeat(Math.max(0, width - str.length))
  if (align === 'L') return str + pad
  if (align === 'C') { const half = Math.floor(pad.length / 2); return pad.slice(0, half) + str + pad.slice(half) }
  return pad + str
}

/** calc percentage discount between two prices */
function CalcDiscount(price: number | string, original: number | string): string {
  const p = parseFloat(String(price)); const o = parseFloat(String(original))
  if (!o || o <= p) return '0'
  return Math.round(((o - p) / o) * 100).toString()
}

/**
 * GS1 Application Identifier extractor.
 * gs1(row.barcode, '01')  → GTIN from GS1-128
 * gs1(row.barcode, '17')  → expiry date
 */
function gs1(barcode: string, ai: string): string {
  if (!barcode) return ''
  // Strip FNC1 markers and parentheses-style HRI
  const clean = String(barcode).replace(/[()]/g, '')
  const idx = clean.indexOf(ai)
  if (idx === -1) return ''
  // Known fixed-length AIs
  const FIXED: Record<string, number> = {
    '00': 18, '01': 14, '02': 14, '03': 14, '04': 16,
    '11': 6, '12': 6, '13': 6, '15': 6, '16': 6, '17': 6,
    '20': 2, '31': 7, '32': 7, '33': 7, '34': 7, '35': 7, '36': 7,
  }
  const len = FIXED[ai]
  const start = idx + ai.length
  return len ? clean.slice(start, start + len) : clean.slice(start).split('\x1D')[0]
}

/** Date/time helpers */
function today(fmt_str = 'yyyy-MM-dd') { return fmt(new Date(), fmt_str) }
function now(fmt_str = 'HH:mm:ss')     { return fmt(new Date(), fmt_str) }

// Helper bundle passed to formula scope
const FORMULA_HELPERS = { fmt, If, Left, Right, Mid, Trim, Upper, Lower, Len, Replace, Pad, CalcDiscount, gs1, today, now }

// ---------------------------------------------------------------------------
// Template resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a template string against a data row.
 *
 * Syntax:
 *   {{field}}                  — field substitution
 *   {{=row.price * 1.1}}       — JS formula; `row`, `rowIndex`, `totalRows`,
 *                                and all helpers in scope
 *   {{#counter}}               — 1, 2, 3, … (auto-increment per row)
 *   {{#counter:5:2:4}}         — start=5 step=2 pad=4 → "0005","0007",…
 *   {{#label_counter}}         — alias for {{#counter}} (1-based)
 *   {{#record_counter}}        — 1-based record index (same as rowIndex+1)
 *   {{#total_records}}         — total row count (passed as totalRows)
 *
 * Formula helpers available inside {{= }}:
 *   fmt(val, pattern)          — Excel-style number/date format
 *   If(cond, a, b)             — conditional
 *   Left(s,n), Right(s,n), Mid(s,start,len), Trim(s), Upper(s), Lower(s)
 *   Len(s), Replace(s,f,r), Pad(s,w,char,align)
 *   CalcDiscount(price,orig)   — discount percentage as string
 *   gs1(barcode, ai)           — extract GS1 application identifier value
 *   today(fmt?), now(fmt?)     — current date/time
 */
export function resolveTemplate(
  template: string,
  row: DataRow,
  rowIndex: number,
  totalRows = 0,
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, inner: string) => {
    const t = inner.trim()

    if (t.startsWith('=')) return evalFormula(t.slice(1).trim(), row, rowIndex, totalRows)

    if (t.startsWith('#counter') || t === '#label_counter') {
      const parts = t.split(':')
      const start = parseInt(parts[1] ?? '1', 10)
      const step  = parseInt(parts[2] ?? '1', 10)
      const pad   = parseInt(parts[3] ?? '0', 10)
      const value = start + rowIndex * step
      return pad > 0 ? String(value).padStart(pad, '0') : String(value)
    }
    if (t === '#record_counter') return String(rowIndex + 1)
    if (t === '#total_records')  return String(totalRows)

    return row[t] ?? ''
  })
}

function evalFormula(expr: string, row: DataRow, rowIndex: number, totalRows: number): string {
  try {
    const helperNames  = Object.keys(FORMULA_HELPERS)
    const helperValues = Object.values(FORMULA_HELPERS)
    // eslint-disable-next-line no-new-func
    const fn = new Function('row', 'rowIndex', 'totalRows', ...helperNames,
      `"use strict"; return String(${expr})`)
    return fn(row, rowIndex, totalRows, ...helperValues) as string
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

/** Applies a data row to all canvas objects. */
export async function applyMerge(
  canvas: Canvas,
  row: DataRow,
  rowIndex: number,
  totalRows = 0,
): Promise<void> {
  const objects = canvas.getObjects() as WithCustomData[]

  for (const obj of objects) {
    const cd = obj.customData

    if (cd?.condition) {
      obj.set({ visible: evalCondition(cd.condition, row, rowIndex) })
    }

    if (!cd?.template) continue

    const resolved = resolveTemplate(cd.template, row, rowIndex, totalRows)

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
      try {
        await (obj as FabricImage).setSrc(resolved, { crossOrigin: 'anonymous' })
      } catch {
        // Network failure or CORS — skip
      }
    }
  }

  canvas.renderAll()
}

/** Resets text objects to raw template strings before saving. */
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
