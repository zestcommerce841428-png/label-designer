# LabelForge

Professional web-based label design and printing platform.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ecf8e?logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/license-Private-red)](LICENSE)

Design, merge, and print labels from any browser — no software to install.
Inspired by [AzureLabel](https://azurelabel.com) (Windows desktop), LabelForge brings the same power to every OS.

[Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Architecture](#architecture) · [Roadmap](#roadmap) · [Contributing](#contributing)

---

## Features

### Canvas Editor

- Drag-and-drop canvas powered by **Fabric.js 6**
- Elements: text (inline editing), rectangles, circles, lines, uploaded images
- Full undo / redo history (capped at 50 states, stored in Zustand)
- 14 label size presets — Avery 5160/5163/5164/5167/5371, thermal 57×32 / 80×40 / 100×150, A4, Letter, custom
- Properties panel: font size, colour, bold, italic, fill, stroke, opacity
- Text alignment: left / centre / right

### Barcode Engine

- **8 barcode types** rendered client-side via `bwip-js`: QR Code, Code 128, EAN-13, EAN-8, UPC-A, Data Matrix, PDF417, Code 39
- Value can be static text or a `{{merge_tag}}`
- Type and value editable per element from the Properties panel

### Data Import & Merge Tags

- Import **CSV** or **Excel (.xlsx / .xls)** — up to 10 MB
- Row-by-row preview with live canvas update
- `{{field_name}}` merge tag system — click any tag to copy, paste into text or barcode elements

### Print & Export

- **Browser print** — `@page` CSS sized exactly to label dimensions
- **PNG export** — 2× resolution canvas download
- **PDF export** — Puppeteer sidecar on VPS, proxied through `/api/export/pdf`
- Print job log (label, record count, timestamp, status) stored in Supabase

### Template Library

- 10 built-in templates: Product, Shipping, Price Tag, Inventory, Address, Food/Ingredients, Asset Tag, 3× Blank sizes
- Gallery page cached server-side with Next.js 16 `"use cache"` + `cacheLife('hours')`

### Auth & Security

- Email/password via **Supabase Auth**
- Row-Level Security — users only access their own rows
- Server Action input validation (UUID format, payload size, field bounds)
- Ownership check before every label load (prevents IDOR)
- Auth guard via Next.js 16 `proxy.ts`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 · App Router · Turbopack · Cache Components · React Compiler |
| Canvas | Fabric.js 6 |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 |
| Auth & Database | Supabase (Auth + PostgreSQL + RLS) |
| Barcode rendering | bwip-js (client-side, no server round-trip) |
| Data import | xlsx + papaparse |
| PDF rendering | Puppeteer (Express sidecar on VPS) |
| Deployment | Vercel (frontend) + Hostinger VPS (PDF service) |

---

## Architecture

```text
label-designer/
├── app/
│   ├── (auth)/
│   │   ├── login/              # Supabase email login
│   │   └── signup/             # Account creation
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar (Suspense-wrapped for PPR)
│   │   ├── dashboard/          # Label list — PPR, streamed via Suspense
│   │   ├── editor/[id]/        # Canvas editor — PPR, ownership-checked
│   │   ├── templates/          # Template gallery — "use cache" server component
│   │   ├── history/            # Print history — PPR, streamed
│   │   └── data/               # Data sources (Phase 2 placeholder)
│   ├── api/export/pdf/         # PDF proxy — validates secret before forwarding
│   └── page.tsx                # Static landing page
│
├── actions/
│   └── labels.ts               # Server Actions: create / save / delete / duplicate / logPrint
│                               # All inputs validated via lib/validation.ts
│
├── components/
│   ├── editor/
│   │   ├── FabricCanvas.tsx    # Fabric.js 6 canvas + grid + merge-tag engine
│   │   ├── Toolbar.tsx         # Add-element toolbar (delegates to lib/canvas/)
│   │   ├── PropertiesPanel.tsx # Element + label-size properties
│   │   └── DataImportPanel.tsx # CSV/Excel import + merge-tag copy
│   ├── layout/
│   │   └── Sidebar.tsx         # Dashboard navigation
│   └── ErrorBoundary.tsx       # React error boundary with retry
│
├── lib/
│   ├── canvas/
│   │   ├── elements.ts         # Pure canvas ops: addText, addBarcode, delete…
│   │   ├── history.ts          # snapshot / undo / redo (reads/writes Zustand)
│   │   └── index.ts            # Barrel export
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client (async cookies)
│   │   └── schema.sql          # Tables + RLS policies — run once in SQL Editor
│   ├── store/
│   │   └── editor.ts           # Zustand: label state + bounded history stacks
│   ├── barcode.ts              # bwip-js wrapper — generateBarcodeDataURL()
│   ├── constants.ts            # Named constants (viewport sizes, limits, depths)
│   ├── label-sizes.ts          # 14 size presets + mmToPx utility
│   ├── templates.ts            # 10 built-in templates
│   └── validation.ts           # assertUUID / assertLabelName / assertCanvasJson
│
├── types/
│   └── fabric-extensions.ts    # Typed Fabric.js extensions (id, customData)
│
├── proxy.ts                    # Auth guard (Next.js 16 — replaces middleware.ts)
└── next.config.ts              # cacheComponents, reactCompiler, Turbopack FS cache
```

### Key design decisions

| Decision | Rationale |
|---|---|
| `proxy.ts` not `middleware.ts` | Next.js 16 renamed the auth guard entrypoint |
| Canvas actions in `lib/canvas/` | Keeps components thin; canvas logic is testable in isolation |
| History stack in Zustand | Avoids module-level globals that survive across React re-mounts |
| `"use cache"` on template gallery | Templates change rarely — cached for hours, no DB hit per visitor |
| Ownership check before label load | Prevents IDOR — users cannot access other users' labels by UUID |
| `assertUUID` on all Server Actions | Blocks injection via malformed IDs before any DB query |
| `ErrorBoundary` around canvas panels | Canvas errors don't crash the whole editor layout |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- (Optional) A VPS for PDF export

### 1. Clone and install

```bash
git clone https://github.com/zestcommerce841428-png/label-designer.git
cd label-designer
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** → paste the contents of `lib/supabase/schema.sql` → **Run**
3. Copy your project URL and anon key from **Project Settings → API**

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional — PDF export via VPS sidecar
PDF_API_URL=http://your-vps-ip:3001
PDF_API_SECRET=change-me-to-a-long-random-string
```

### 4. Run locally

```bash
npm run dev
```

Open <http://localhost:3000> → **Sign up** → start designing.

---

## PDF Export Sidecar (optional)

The `/api/export/pdf` route proxies to a Puppeteer Express service on your VPS.
It returns `503` if either `PDF_API_URL` or `PDF_API_SECRET` is missing — it never forwards unauthenticated requests.

```js
// pdf-server.js — deploy on your VPS
const express = require('express')
const puppeteer = require('puppeteer')
const app = express()
app.use(express.json({ limit: '10mb' }))

app.post('/render', async (req, res) => {
  if (req.headers['x-secret'] !== process.env.SECRET) return res.status(401).end()
  const { html, width, height } = req.body
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(html)
  const pdf = await page.pdf({ width: `${width}mm`, height: `${height}mm`, printBackground: true })
  await browser.close()
  res.set('Content-Type', 'application/pdf').send(pdf)
})

app.listen(3001)
```

```bash
# On your VPS
SECRET=your-pdf-api-secret node pdf-server.js
```

---

## Deployment

### Frontend — Vercel

```bash
npx vercel
```

Add all `.env.local` variables in **Vercel → Project → Settings → Environment Variables**.

### Build output

```text
○  /                (static)
○  /login           (static)
○  /signup          (static)
○  /templates       (cached, revalidates every hour)
◐  /dashboard       (partial prerender)
◐  /editor/[id]     (partial prerender)
◐  /history         (partial prerender)
ƒ  /api/export/pdf  (dynamic)
```

---

## Database Schema

```sql
labels           -- user label designs (canvas JSON + size config)
template_library -- built-in templates (public, read-only)
print_jobs       -- print history log per user
data_sources     -- (Phase 2) saved data source connections
```

All user tables have Row Level Security — users can only read and write their own rows.
Run `lib/supabase/schema.sql` in the Supabase SQL Editor to create tables, RLS policies, and triggers.

---

## Next.js 16 Patterns

| Pattern | Where used |
|---|---|
| `proxy.ts` auth guard | `proxy.ts` — replaces deprecated `middleware.ts` |
| `"use cache"` + `cacheLife('hours')` | `app/(dashboard)/templates/page.tsx` |
| `<Suspense>` for all dynamic data | Editor, dashboard, history pages, sidebar |
| Async `params` inside Suspense | `app/(dashboard)/editor/[id]/page.tsx` |
| React Compiler (`reactCompiler: true`) | `next.config.ts` — auto-memoises canvas components |
| Turbopack FS cache | `turbopackFileSystemCacheForDev: true` in `next.config.ts` |
| `cacheComponents: true` | Enables `"use cache"` directive globally |

---

## AzureLabel Parity

| Feature | Status |
|---|---|
| Visual drag-and-drop designer | ✅ MVP |
| Text, shapes, image elements | ✅ MVP |
| 8 barcode types (QR, EAN, Code 128…) | ✅ MVP |
| CSV / Excel data import | ✅ MVP |
| Merge tags `{{field}}` | ✅ MVP |
| Label size presets (Avery, thermal, A4) | ✅ MVP |
| PNG export | ✅ MVP |
| Browser print | ✅ MVP |
| PDF export (VPS Puppeteer) | ✅ MVP |
| Print history log | ✅ MVP |
| 10-template library | ✅ MVP |
| Supabase auth + RLS | ✅ MVP |
| Batch multi-page print (browser) | ✅ Phase 2 |
| Serial number counters `{{#counter}}` | ✅ Phase 2 |
| Conditional element visibility | ✅ Phase 2 |
| JavaScript formula fields `{{=expr}}` | ✅ Phase 2 |
| Google Sheets live connection | ✅ Phase 2 |
| Print history CSV export | ✅ Phase 2 |
| REST API with API keys | ✅ Phase 2 |
| MySQL / PostgreSQL direct connection | 🔜 Phase 3 |
| 95 barcode types (full bwip-js) | 🔜 Phase 3 |
| ZPL / TSPL / EPL raw thermal output | 🔜 Phase 3 |
| NiceLabel / Loftware XML import | 🔜 Phase 3 |
| Team workspaces + RBAC | 🔜 Phase 3 |
| SSO / SAML | 🔜 Phase 3 |
| Multi-language UI (FR, DE, PT, RU, ES, UK) | 🔜 Phase 3 |
| On-premise Docker Compose deploy | 🔜 Phase 3 |

---

## Roadmap

### Phase 2 — Data and Integrations

- [x] Google Sheets live connection (paste share URL → auto-fetch CSV via `/api/sheets-proxy`)
- [x] REST API with API key auth (`/api/v1/labels/[id]/print`, manage keys at `/settings/api`)
- [x] Batch multi-page print (one record per page, up to 500 rows, DPR×3 quality)
- [x] Serial number counters (`{{#counter:start:step:pad}}`)
- [x] Conditional element visibility (`Show when` JS expression in Properties panel)
- [x] JavaScript formula fields (`{{=row.price * 1.1}}`)
- [x] Print history CSV export
- [ ] MySQL / PostgreSQL direct connection
- [ ] Print history PDF download (re-render to PDF via sidecar)

### Phase 3 — Enterprise

- [ ] 95 barcode types (full bwip-js: GS1, postal, healthcare)
- [ ] ZPL / TSPL / EPL raw output for thermal printers
- [ ] NiceLabel / Loftware XML print job import
- [ ] File trigger automation (watch folder → auto-print)
- [ ] Webhook print server
- [ ] Team workspaces + RBAC (Admin / Designer / Operator)
- [ ] SSO / SAML
- [ ] Record Details (repeating structured data: ingredients, specs, parts)
- [ ] Meta Labels (multi-design, multi-printer workflows)
- [ ] Bleed support for professional print shops
- [ ] Multi-language UI
- [ ] On-premise Docker Compose deploy
- [ ] White-label / custom domain

### Pricing model (planned)

| Plan | Price | Limits |
|---|---|---|
| Free | $0 / mo | 3 labels, 50 prints / mo |
| Starter | $12 / mo | 50 labels, 500 prints, CSV import |
| Pro | $29 / mo | Unlimited labels, API access, 3 team seats |
| Business | $79 / mo | 10 seats, DB connections, priority support |
| Enterprise | Custom | SSO, on-prem deploy, SLA |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, coding conventions, and pull request guidelines.

---

## License

Private — All rights reserved.
