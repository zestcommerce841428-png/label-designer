import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const pdfApiUrl = process.env.PDF_API_URL
  const pdfApiSecret = process.env.PDF_API_SECRET

  if (!pdfApiUrl) {
    return NextResponse.json({ error: 'PDF service not configured' }, { status: 503 })
  }
  if (!pdfApiSecret) {
    // Fail closed — never proxy without authentication
    return NextResponse.json({ error: 'PDF service misconfigured' }, { status: 503 })
  }

  let body: { html?: unknown; width?: unknown; height?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { html, width, height } = body
  if (typeof html !== 'string' || typeof width !== 'number' || typeof height !== 'number') {
    return NextResponse.json({ error: 'Missing required fields: html, width, height' }, { status: 400 })
  }

  try {
    const res = await fetch(`${pdfApiUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret': pdfApiSecret,
      },
      body: JSON.stringify({ html, width, height }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'PDF render failed' }, { status: 500 })
    }

    const pdf = await res.arrayBuffer()
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="label.pdf"',
      },
    })
  } catch {
    return NextResponse.json({ error: 'PDF service unavailable' }, { status: 503 })
  }
}
