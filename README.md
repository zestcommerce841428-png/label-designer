# LabelForge — Web Label Designer

A full-featured, browser-based label design and printing platform built with **Next.js 16**. Inspired by AzureLabel (Windows desktop), LabelForge brings the same power to any OS, any browser, with no install required.

---

## Features

### Label Designer
- Drag-and-drop canvas powered by **Fabric.js 6**
- Elements: text (inline editing), rectangles, circles, lines, uploaded images
- Undo / redo history
- Label size presets: Avery 5160/5163/5164/5167/5371, thermal 57×32 / 80×40 / 100×150, A4, Letter, custom
- Properties panel: font size, color, bold, italic, fill, stroke, opacity, rotation

### Barcode Engine
- **8 barcode types** via `bwip-js`: QR Code, Code 128, EAN-13, EAN-8, UPC-A, Data Matrix, PDF417, Code 39
- Barcode value can be static or a `{{merge_tag}}`
- Type + value selectable from properties panel per element
- Client-side rendering — no server round-trip

### Data Import & Merge Tags
- Import **CSV** or **Excel (.xlsx / .xls)** files
- Column preview with row-by-row navigation
- `{{field_name}}` merge tag system — paste into any text or barcode element
- Live preview: switch rows to see merged output on canvas

### Print & Export
- **Browser print** — `@page` CSS sized exactly to label dimensions
- **PNG export** — 2× resolution canvas download
- **PDF export** — Puppeteer sidecar on VPS
- Print job log in Supabase (label, record count, timestamp, status)
- Reopen any past label from print history

### Template Library
- 10 built-in templates: Product, Shipping, Price Tag, Inventory, Address, Food/Ingredients, Asset Tag, 3× Blank
- Gallery cached with Next.js 16 `"use cache"` + `cacheLife('hours')`

### Auth & Security
- Email/password via **Supabase Auth**
- Row-Level Security — users only see their own data
- Auth guard via Next.js 16 `proxy.ts`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack, Cache Components, React Compiler) |
| Canvas | Fabric.js 6 |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 |
| Auth & DB | Supabase (Auth + PostgreSQL + Storage) |
| Barcode | bwip-js |
| Data import | xlsx + papaparse |
| PDF render | Puppeteer (Express sidecar on VPS) |
| Deploy | Vercel (frontend) + Hostinger VPS (PDF service) |

---

## Project Structure

```
label-designer/
├── app/
│   ├── (auth)/login/            # Login page
│   ├── (auth)/signup/           # Sign-up page
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Sidebar layout (Suspense-wrapped)
│   │   ├── dashboard/           # Label list (My Labels)
│   │   ├── editor/[id]/         # Canvas editor (PPR)
│   │   ├── templates/           # Template gallery (use cache)
│   │   ├── history/             # Print history (PPR)
│   │   └── data/                # Data sources placeholder
│   ├── api/export/pdf/          # PDF export proxy route
│   └── page.tsx                 # Landing page (static)
├── actions/
│   └── labels.ts                # Server Actions: create/save/delete/duplicate/log
├── components/
│   ├── editor/
│   │   ├── FabricCanvas.tsx     # Fabric.js v6 canvas + grid
│   │   ├── Toolbar.tsx          # Add elements toolbar
│   │   ├── PropertiesPanel.tsx  # Element + label size properties
│   │   └── DataImportPanel.tsx  # CSV/Excel import + merge tags
│   └── layout/
│       └── Sidebar.tsx          # Dashboard navigation
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── server.ts            # Server Supabase client (async cookies)
│   │   └── schema.sql           # DB schema + RLS policies
│   ├── store/editor.ts          # Zustand editor state
│   ├── barcode.ts               # bwip-js wrapper (8 types)
│   ├── label-sizes.ts           # Size presets + mm→px util
│   └── templates.ts             # 10 built-in templates
├── proxy.ts                     # Auth guard (Next.js 16 proxy.ts)
├── next.config.ts               # cacheComponents, reactCompiler, Turbopack FS cache
└── .env.local.example           # Environment variable template
```

---

## Next.js 16 Patterns Used

| Feature | Where used |
|---|---|
| `cacheComponents: true` | `next.config.ts` — enables `"use cache"` directive |
| `"use cache"` + `cacheLife('hours')` | `app/(dashboard)/templates/page.tsx` |
| `proxy.ts` (replaces `middleware.ts`) | Root `proxy.ts` — auth redirect guard |
| Async `params` / `cookies()` | All route handlers + server actions |
| `<Suspense>` for all dynamic data | Editor page, dashboard, history, sidebar |
| React Compiler (`reactCompiler: true`) | Auto-memoization of canvas components |
| Turbopack FS cache | `turbopackFileSystemCacheForDev: true` |
| Partial Prerendering (PPR) | `/dashboard`, `/editor/[id]`, `/history` |

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/label-designer.git
cd label-designer
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `lib/supabase/schema.sql` → Run
3. Copy your project URL and anon key

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PDF_API_URL=http://your-vps-ip:3001
PDF_API_SECRET=changeme
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Schema

```sql
labels           -- user's label designs (canvas JSON + size config)
template_library -- public built-in templates (cached)
print_jobs       -- print history log
data_sources     -- (Phase 2) saved data source connections
```

All tables have Row Level Security — users only access their own rows.

---

## PDF Export Sidecar (VPS)

The `/api/export/pdf` route proxies to a Puppeteer Express service on your VPS.

```js
// pdf-server.js — deploy on Hostinger VPS
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
# On VPS
SECRET=your-secret node pdf-server.js
```

---

## Deployment

### Frontend (Vercel)

```bash
npx vercel
```

Add all `.env.local` variables in the Vercel dashboard.

### Build Output

```
○  /              (static)
○  /login         (static)
○  /signup        (static)
○  /templates     (static, revalidates every hour)
◐  /dashboard     (partial prerender)
◐  /editor/[id]   (partial prerender)
◐  /history       (partial prerender)
ƒ  /api/export/pdf (dynamic)
```

---

## Roadmap

### Phase 2 (Weeks 7–14)
- [ ] Google Sheets live integration
- [ ] MySQL / PostgreSQL direct connection
- [ ] REST API with API keys (external print triggers)
- [ ] Batch multi-page PDF print (one record per page)
- [ ] Serial number counters (auto-increment, prefix, reset)
- [ ] Conditional element visibility (show/hide by field value)
- [ ] JavaScript formula fields
- [ ] Print history PDF download

### Phase 3 (Weeks 15–24)
- [ ] 95 barcode types (full bwip-js coverage including GS1, postal, healthcare)
- [ ] ZPL / TSPL / EPL raw output for thermal printers
- [ ] NiceLabel / Loftware XML job import
- [ ] File trigger automation (watch folder → auto-print)
- [ ] Webhook print server
- [ ] Team workspaces + RBAC (Admin / Designer / Operator)
- [ ] SSO / SAML
- [ ] Record Details (repeating structured data: ingredients, specs, parts)
- [ ] Meta Labels (multi-design, multi-printer workflows)
- [ ] Bleed support for professional print shops
- [ ] Multi-language UI (FR, DE, PT, RU, ES, UK)
- [ ] On-premise Docker Compose deploy
- [ ] White-label / custom domain

### Pricing
| Plan | Price | Limits |
|---|---|---|
| Free | $0/mo | 3 labels, 50 prints/mo |
| Starter | $12/mo | 50 labels, 500 prints, CSV |
| Pro | $29/mo | Unlimited, API access, 3 team members |
| Business | $79/mo | 10 users, DB connections, priority support |
| Enterprise | Custom | SSO, on-prem, SLA |

---

## AzureLabel Parity Tracker

| Feature | Status |
|---|---|
| Visual drag-and-drop designer | ✅ MVP |
| Text, shapes, images on canvas | ✅ MVP |
| 8 barcode types (QR, EAN, Code128…) | ✅ MVP |
| CSV / Excel data import | ✅ MVP |
| Merge tags `{{field}}` | ✅ MVP |
| Label size presets (Avery, thermal, A4) | ✅ MVP |
| PNG export | ✅ MVP |
| Browser print | ✅ MVP |
| PDF export | ✅ MVP |
| Print history | ✅ MVP |
| 10-template library | ✅ MVP |
| Supabase auth + RLS | ✅ MVP |
| Batch multi-page PDF print | 🔜 Phase 2 |
| Google Sheets integration | 🔜 Phase 2 |
| SQL database connection | 🔜 Phase 2 |
| REST API for external print | 🔜 Phase 2 |
| Serial number counters | 🔜 Phase 2 |
| Conditional element visibility | 🔜 Phase 2 |
| JavaScript formula fields | 🔜 Phase 2 |
| 95 barcode types | 🔜 Phase 3 |
| ZPL / TSPL raw thermal output | 🔜 Phase 3 |
| NiceLabel XML import | 🔜 Phase 3 |
| File trigger automation | 🔜 Phase 3 |
| Record Details (ingredients etc.) | 🔜 Phase 3 |
| Meta Labels (multi-printer workflows) | 🔜 Phase 3 |
| Team RBAC | 🔜 Phase 3 |
| SSO / SAML | 🔜 Phase 3 |
| Bleed support | 🔜 Phase 3 |
| Multi-language UI | 🔜 Phase 3 |
| On-premise deploy | 🔜 Phase 3 |

---

## License

Private — All rights reserved.
