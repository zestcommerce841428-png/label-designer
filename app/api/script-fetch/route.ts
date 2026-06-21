/**
 * SSRF-safe HTTP proxy for formula httpGet() calls.
 *
 * Security controls:
 *   • Auth required — anonymous users cannot proxy requests
 *   • HTTPS only — no plain-HTTP or file:// schemes
 *   • Private-range block — 10.x, 172.16-31.x, 192.168.x, 127.x, ::1, link-local
 *   • Private TLD block — .local, .internal, .corp, .lan
 *   • 5-second timeout
 *   • 100 KB response cap
 *   • Stripped dangerous request headers (Cookie, Authorization, Host, etc.)
 *   • Rate limited: 60 requests / minute per user
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitResponse } from '@/lib/ratelimit'

const TIMEOUT_MS = 5_000
const MAX_BYTES   = 100 * 1024   // 100 KB

/** Returns true for private / loopback / link-local hosts. */
function isBlockedHost(url: URL): boolean {
  const h = url.hostname.toLowerCase().replace(/^\[|\]$/g, '') // strip IPv6 brackets

  // Loopback
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') return true

  // Private TLDs
  if (/\.(local|internal|corp|lan|home|arpa)$/.test(h)) return true

  // IPv4 private ranges
  const quad = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (quad) {
    const [, a, b] = quad.map(Number)
    if (a === 10) return true                          // 10.0.0.0/8
    if (a === 127) return true                         // 127.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true  // 172.16.0.0/12
    if (a === 192 && b === 168) return true            // 192.168.0.0/16
    if (a === 169 && b === 254) return true            // 169.254.0.0/16 link-local
    if (a === 0) return true                           // 0.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 shared
    if (a === 198 && (b === 18 || b === 19)) return true // 198.18.0.0/15 benchmark
  }

  // IPv6 private / link-local / ULA
  if (h === '::' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return true

  return false
}

const BLOCKED_REQUEST_HEADERS = /^(host|cookie|authorization|x-forwarded|x-real-ip|content-length|transfer-encoding)$/i

export async function POST(req: NextRequest) {
  // Auth gate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 60 req/min per user
  const rl = rateLimit(`script-fetch:${user.id}`, 60, 60_000)
  const limited = rateLimitResponse(rl)
  if (limited) return limited

  // Parse body
  let body: { url?: unknown; headers?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.url || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'Missing required field: url (string)' }, { status: 400 })
  }

  // Validate & parse URL
  let target: URL
  try {
    target = new URL(body.url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // HTTPS only
  if (target.protocol !== 'https:') {
    return NextResponse.json({ error: 'Only HTTPS URLs are allowed' }, { status: 400 })
  }

  // SSRF block
  if (isBlockedHost(target)) {
    return NextResponse.json({ error: 'URL target is not allowed (private/internal address)' }, { status: 403 })
  }

  // Build safe forwarding headers
  const forwardHeaders: Record<string, string> = {
    'User-Agent': 'LabelForge-Script/1.0',
    'Accept': 'text/plain, application/json, text/csv, */*',
  }
  if (body.headers && typeof body.headers === 'object' && !Array.isArray(body.headers)) {
    for (const [k, v] of Object.entries(body.headers as Record<string, unknown>)) {
      if (typeof k === 'string' && typeof v === 'string' && !BLOCKED_REQUEST_HEADERS.test(k)) {
        forwardHeaders[k] = v
      }
    }
  }

  // Proxy the request
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: forwardHeaders,
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)

    // Enforce size cap
    const cl = upstream.headers.get('content-length')
    if (cl && parseInt(cl, 10) > MAX_BYTES) {
      return NextResponse.json({ error: 'Remote response too large (max 100 KB)' }, { status: 413 })
    }

    const buf = await upstream.arrayBuffer()
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Remote response too large (max 100 KB)' }, { status: 413 })
    }

    const text = new TextDecoder().decode(buf)
    const contentType = upstream.headers.get('content-type') ?? 'text/plain'

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Remote-Status': String(upstream.status),
        'X-RateLimit-Remaining': String(rl.remaining),
      },
    })
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Remote request timed out (5 s)' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Failed to reach remote URL' }, { status: 502 })
  }
}
