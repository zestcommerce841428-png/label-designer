import {
  MAX_LABEL_NAME_LENGTH,
  MAX_CANVAS_JSON_BYTES,
  MAX_RECORD_COUNT,
} from './constants'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Throws if the string is not a valid UUID v4 */
export function assertUUID(value: string, field = 'id'): void {
  if (!UUID_RE.test(value)) {
    throw new Error(`Invalid ${field}`)
  }
}

export function assertLabelName(name: string): void {
  if (!name || name.trim().length === 0) throw new Error('Label name is required')
  if (name.length > MAX_LABEL_NAME_LENGTH) throw new Error(`Label name too long (max ${MAX_LABEL_NAME_LENGTH} chars)`)
}

export function assertCanvasJson(json: object): void {
  const size = JSON.stringify(json).length
  if (size > MAX_CANVAS_JSON_BYTES) {
    throw new Error(`Canvas JSON too large (max ${MAX_CANVAS_JSON_BYTES / 1024}KB)`)
  }
}

export function assertRecordCount(count: number): void {
  if (!Number.isInteger(count) || count < 0 || count > MAX_RECORD_COUNT) {
    throw new Error(`Record count out of range (0–${MAX_RECORD_COUNT})`)
  }
}
