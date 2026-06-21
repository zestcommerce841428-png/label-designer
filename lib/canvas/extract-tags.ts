/**
 * Extracts all unique {{fieldName}} merge tags from a canvas JSON object.
 * Ignores formula tags ({{= ... }}), counter tags ({{#...}}), and built-in
 * helpers so only plain data-field names are returned.
 */
export function extractMergeTags(canvasJson: object): string[] {
  const json = JSON.stringify(canvasJson)
  const MERGE_RE = /\{\{([^=#{][^}]*?)\}\}/g
  const found = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = MERGE_RE.exec(json)) !== null) {
    const tag = m[1].trim()
    if (tag) found.add(tag)
  }
  return Array.from(found).sort()
}
