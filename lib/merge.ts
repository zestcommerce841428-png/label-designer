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
// Template resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a template string against a data row.
 *
 * Supported syntax:
 *   {{field}}              — simple field substitution
 *   {{=row.price * 1.1}}   — JavaScript formula; `row` and `rowIndex` are in scope
 *   {{#counter}}           — auto-increment starting at 1 (step 1, no padding)
 *   {{#counter:5:2:4}}     — start=5, step=2, pad to 4 digits → "0005", "0007", …
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
      const step = parseInt(parts[2] ?? '1', 10)
      const pad = parseInt(parts[3] ?? '0', 10)
      const value = start + rowIndex * step
      return pad > 0 ? String(value).padStart(pad, '0') : String(value)
    }

    return row[t] ?? ''
  })
}

function evalFormula(expr: string, row: DataRow, rowIndex: number): string {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('row', 'rowIndex', `"use strict"; return String(${expr})`)
    return fn(row, rowIndex) as string
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

/**
 * Applies a data row to all objects on the canvas:
 *   - Sets visibility based on `customData.condition`
 *   - Resolves `customData.template` into the rendered text / barcode value
 *
 * This mutates the live canvas objects. Call `canvas.renderAll()` after.
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
        // Invalid barcode value — leave the previous image intact
      }
    }
  }

  canvas.renderAll()
}

/**
 * Resets all template-bearing text objects to show their raw template string.
 * Call this before serialising the canvas to JSON so saved files contain
 * `{{field}}` placeholders rather than merged values from a previous preview.
 */
export function resetToTemplates(canvas: Canvas): void {
  const objects = canvas.getObjects() as WithCustomData[]
  for (const obj of objects) {
    const template = obj.customData?.template
    if (!template) continue
    if (obj.type === 'i-text' || obj.type === 'text') {
      ;(obj as IText).set({ text: template })
    }
    // Restore visibility so hidden conditional elements are saved as visible
    obj.set({ visible: true })
  }
}
