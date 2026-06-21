import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGIN = 'https://docs.google.com'
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Only proxy Google Sheets export URLs
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!parsed.origin.startsWith(ALLOWED_ORIGIN)) {
    return NextResponse.json({ error: 'Only Google Sheets URLs are allowed' }, { status: 403 })
  }
  if (!parsed.pathname.includes('/spreadsheets/')) {
    return NextResponse.json({ error: 'URL must be a Google Sheets spreadsheet' }, { status: 403 })
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'LabelForge/1.0' },
      // Follow redirects (Sheets export redirects once)
      redirect: 'follow',
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error ${upstream.status}` },
        { status: upstream.status },
      )
    }

    // Guard against excessively large sheets
    const contentLength = upstream.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
      return NextResponse.json({ error: 'Sheet too large (max 10 MB)' }, { status: 413 })
    }

    const text = await upstream.text()
    if (text.length > MAX_RESPONSE_BYTES) {
      return NextResponse.json({ error: 'Sheet too large (max 10 MB)' }, { status: 413 })
    }

    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    })
  } catch (err) {
    console.error('[sheets-proxy]', err)
    return NextResponse.json({ error: 'Failed to fetch sheet' }, { status: 502 })
  }
}
