import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { html, width, height } = body

  const pdfApiUrl = process.env.PDF_API_URL
  const pdfApiSecret = process.env.PDF_API_SECRET

  if (!pdfApiUrl) {
    return NextResponse.json({ error: 'PDF service not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(`${pdfApiUrl}/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret': pdfApiSecret ?? '',
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
