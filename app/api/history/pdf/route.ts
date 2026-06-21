import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: jobs } = await supabase
    .from('print_jobs')
    .select('label_name, record_count, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500)

  if (!jobs) return NextResponse.json({ error: 'No data' }, { status: 500 })

  const rows = jobs.map(j => `
    <tr>
      <td>${escHtml(j.label_name)}</td>
      <td style="text-align:right">${j.record_count}</td>
      <td>${escHtml(j.status)}</td>
      <td>${new Date(j.created_at).toLocaleString()}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LabelForge — Print History</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; font-size: 11px; color: #111; padding: 32px; }
    h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .sub { color: #666; font-size: 10px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .05em;
         color: #666; padding: 6px 8px; border-bottom: 2px solid #e4e4e7; }
    td { padding: 6px 8px; border-bottom: 1px solid #f4f4f5; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .badge { display:inline-block; padding:1px 6px; border-radius:999px; font-size:9px; font-weight:600; }
    .done { background:#f0fdf4; color:#16a34a; }
    .failed { background:#fef2f2; color:#dc2626; }
    .other { background:#fefce8; color:#ca8a04; }
  </style>
</head>
<body>
  <h1>Print History</h1>
  <p class="sub">Generated ${new Date().toLocaleString()} — ${jobs.length} records</p>
  <table>
    <thead>
      <tr>
        <th>Label</th>
        <th style="text-align:right">Records</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`

  // If a Puppeteer sidecar is configured, proxy to it for a real PDF
  const pdfUrl = process.env.PDF_API_URL
  const pdfSecret = process.env.PDF_API_SECRET

  if (pdfUrl && pdfSecret) {
    try {
      const res = await fetch(`${pdfUrl}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret': pdfSecret,
        },
        body: JSON.stringify({ html, width: 210, height: 297 }), // A4
      })
      if (res.ok) {
        const pdf = await res.arrayBuffer()
        return new NextResponse(pdf, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="print-history-${new Date().toISOString().slice(0, 10)}.pdf"`,
          },
        })
      }
    } catch {
      // Fall through to HTML fallback
    }
  }

  // Fallback: return HTML — browser will handle print-to-PDF
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="print-history.html"`,
    },
  })
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
