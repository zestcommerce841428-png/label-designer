import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitResponse } from '@/lib/ratelimit'

const MAX_API_ROWS = 500

/** Verify an API key from the Authorization header. Returns user_id or null. */
async function verifyApiKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null
  const raw = authHeader.slice(7).trim()
  if (!raw.startsWith('lf_live_')) return null

  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  const supabase = await createClient()
  const { data } = await supabase
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', hash)
    .single()

  if (!data) return null

  // Update last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return data.user_id
}

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/v1/labels/:id/print
 *
 * Headers:
 *   Authorization: Bearer lf_live_<key>
 *   Content-Type: application/json
 *
 * Body:
 *   { "rows": [{ "name": "Alice", "sku": "X100" }, …] }
 *
 * Response:
 *   { "label_id": "…", "record_count": 3, "print_url": "/editor/<id>" }
 *
 * The response intentionally returns a redirect URL to the editor rather than
 * rendering server-side (canvas rendering requires a browser / Fabric.js).
 * For headless PDF rendering, use the PDF sidecar at /api/export/pdf instead.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: labelId } = await params

  const userId = await verifyApiKey(req.headers.get('authorization'))
  if (!userId) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })
  }

  // Rate limit: 120 print requests per minute per API key owner
  const rl = rateLimit(`v1-print:${userId}`, 120, 60_000)
  const limited = rateLimitResponse(rl)
  if (limited) return limited

  // Validate label ID format
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(labelId)) {
    return NextResponse.json({ error: 'Invalid label ID' }, { status: 400 })
  }

  // Verify the label belongs to the key owner
  const supabase = await createClient()
  const { data: label } = await supabase
    .from('labels')
    .select('id, name')
    .eq('id', labelId)
    .eq('user_id', userId)
    .single()

  if (!label) {
    return NextResponse.json({ error: 'Label not found' }, { status: 404 })
  }

  let body: { rows?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ error: '`rows` must be an array of objects' }, { status: 400 })
  }

  const rows = body.rows.slice(0, MAX_API_ROWS) as Record<string, string>[]

  // Log the print job
  await supabase.from('print_jobs').insert({
    user_id: userId,
    label_id: labelId,
    label_name: label.name,
    record_count: rows.length || 1,
    status: 'done',
  })

  return NextResponse.json({
    label_id: labelId,
    label_name: label.name,
    record_count: rows.length,
    print_url: `${req.nextUrl.origin}/editor/${labelId}`,
    message: `Print job logged. Open print_url in a browser with the data loaded to render and print.`,
  })
}

/** GET /api/v1/labels/:id — fetch label metadata */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id: labelId } = await params

  const userId = await verifyApiKey(req.headers.get('authorization'))
  if (!userId) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })
  }

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(labelId)) {
    return NextResponse.json({ error: 'Invalid label ID' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: label } = await supabase
    .from('labels')
    .select('id, name, size_config, created_at, updated_at')
    .eq('id', labelId)
    .eq('user_id', userId)
    .single()

  if (!label) {
    return NextResponse.json({ error: 'Label not found' }, { status: 404 })
  }

  return NextResponse.json(label)
}
