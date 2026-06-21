# Contributing to LabelForge

Thank you for taking the time to contribute. This document covers everything you need to get started.

---

## Table of contents

- [Local setup](#local-setup)
- [Project layout](#project-layout)
- [Coding conventions](#coding-conventions)
- [Next.js 16 rules](#nextjs-16-rules)
- [Fabric.js 6 rules](#fabricjs-6-rules)
- [Submitting a pull request](#submitting-a-pull-request)
- [Commit style](#commit-style)

---

## Local setup

```bash
git clone https://github.com/zestcommerce841428-png/label-designer.git
cd label-designer
npm install
cp .env.local.example .env.local   # fill in Supabase keys
npm run dev
```

Run the Supabase schema once:

1. Create a project at <https://supabase.com>
2. SQL Editor → paste `lib/supabase/schema.sql` → Run

---

## Project layout

| Path | Purpose |
|---|---|
| `lib/canvas/` | Pure canvas operations (no React). Add new element types here. |
| `lib/constants.ts` | Every magic number lives here — never inline literals. |
| `lib/validation.ts` | Input guards for Server Actions. |
| `types/fabric-extensions.ts` | Typed Fabric.js extensions (`id`, `customData`). |
| `components/ErrorBoundary.tsx` | Wrap any canvas panel that could throw. |
| `actions/labels.ts` | Server Actions — always validate input before touching the DB. |

---

## Coding conventions

### General

- TypeScript strict mode is on — no `any` without an `eslint-disable` comment explaining why.
- No magic numbers. Add a named export to `lib/constants.ts` instead.
- No comments that restate what the code does. Only comment the *why* when it is non-obvious.
- No unused imports, variables, or files.

### React components

- Keep components thin. Business logic belongs in `lib/`, not in components.
- Use `useCallback` for handlers passed as props.
- Wrap anything that touches the Fabric.js canvas in `<ErrorBoundary>`.
- Never store Fabric.js objects in React state — the canvas owns them.

### Server Actions (`actions/`)

Every action must:

1. Call the relevant `assert*` helpers from `lib/validation.ts` first.
2. Call `supabase.auth.getUser()` and throw if no user.
3. Scope every DB query with `.eq('user_id', user.id)`.
4. Call `revalidatePath` for any route whose data changed.

### Canvas operations (`lib/canvas/`)

- Every operation that changes canvas state must call `snapshot(canvas)` first.
- Functions are plain TypeScript — no React hooks, no imports from `react`.
- Accept `Canvas` as the first argument; never reach for the global `getCanvas()` singleton from here.

---

## Next.js 16 rules

This project uses features that differ from earlier Next.js versions.

| Rule | Reason |
|---|---|
| `proxy.ts` not `middleware.ts` | Next.js 16 renamed the auth guard entrypoint |
| `await params` only inside `<Suspense>` | `params` is a runtime API in Next.js 16; accessing it outside Suspense throws |
| `await cookies()` / `await headers()` | Both are async in Next.js 16 |
| `"use cache"` + `cacheLife()` on server components | Replaces `revalidate` exports |
| All dynamic data inside `<Suspense>` | Required by `cacheComponents: true` |

Before adding any new route or server component, read `node_modules/next/dist/docs/` — APIs change between minor versions.

---

## Fabric.js 6 rules

Fabric.js 6 has breaking changes from v5.

| Rule | Reason |
|---|---|
| Named imports only: `import { Canvas, IText } from 'fabric'` | `import { fabric }` is removed in v6 |
| `FabricImage.fromURL(url)` returns a Promise | Call with `await` |
| `canvas.loadFromJSON(json)` returns a Promise | Call with `.then()` or `await` |
| Custom props (`id`, `customData`) must be in `toObject([...])` | Otherwise they are stripped on serialise |
| Use `types/fabric-extensions.ts` types | Avoid `as any` for custom properties |

---

## Submitting a pull request

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Keep each PR focused on a single concern.
3. Run `npm run build` locally before pushing — the PR must build clean.
4. Write a clear PR description explaining *what* changed and *why*.
5. Reference any related issue numbers.

---

## Commit style

Use conventional commits:

```
feat: add Google Sheets data source connector
fix: ownership check missing from EditorLoader
chore: bump bwip-js to 3.5
docs: update CONTRIBUTING.md setup steps
```

Types: `feat` · `fix` · `chore` · `docs` · `refactor` · `perf` · `test`

---

## Questions

Open an issue or contact the maintainer at <zestcommerce841428@gmail.com>.
