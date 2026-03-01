# Websites — Micro-SaaS Monorepo

## Overview
Three passive-revenue SaaS apps in a pnpm + Turborepo monorepo.

**Apps**: invoicely (port 3001), metatagz (port 3002), palettai (port 3003)

## Tech Stack
- Next.js 14.2.18, TypeScript, Tailwind CSS, shadcn/ui
- Supabase (auth + Postgres), Stripe (billing)
- palettai: Anthropic Claude API + `gemini-2.0-flash` (Google AI SDK)
- pnpm workspaces + Turborepo

## Commands
```bash
pnpm dev                           # Start all 3 apps
pnpm --filter invoicely run dev    # invoicely only (port 3001)
pnpm --filter metatagz run dev     # metatagz only (port 3002)
pnpm --filter palettai run dev     # palettai only (port 3003)
pnpm install --no-frozen-lockfile  # Install/update deps
pnpm run build                     # Build all apps
```

## Shared Packages
- `packages/ui` — Button, Card, Input, Navigation, Footer, PricingCard, AdBanner
- `packages/auth` — Supabase auth (AuthProvider, useUser, useSession hooks)
- `packages/billing` — Stripe (createCheckoutSession, createPortalSession, webhook handler)
- `packages/types` — shared TypeScript types (User, Subscription, AppName)
- `packages/config` — base tsconfig, tailwind config, eslint

## Deployment (Vercel)
Team: `blakes-projects-afd12cfa`
- invoicely → https://invoicely.blakewales.au (prj_Wiku7AVvdvKVgChZe6UbncAJjQqo)
- metatagz → https://metatagz.blakewales.au (prj_cZyLGWms6DR3NyRXRZb2GKgtEeqE)
- palettai → https://palettai.blakewales.au (prj_HkIqSLVVE0bXDjSwsmR1AwpPh2Kg)

Deploy via `.vercel/project.json` switch + `git push` (not `vercel --prod`).
Build command: `cd ../.. && pnpm turbo run build --filter=<app>...`
Output dir: `.next` (relative to rootDirectory)

## Credentials
All keys in `C:\Users\mail\.claude\credentials.env` — section: Websites.
Supabase project: `cyexecqribzrzgrposzm` (micro-saas, Ventari-AU's Org)
Shared Stripe account (test mode). Cloudflare zone: `68cf1738f970decec6e186121d25e687`

## Gotchas
- `next.config.ts` NOT supported in Next 14 — use `next.config.mjs`
- `useSearchParams` requires `<Suspense>` wrapper
- API routes using `cookies()` need `export const dynamic = "force-dynamic"`
- Dashboard/login pages are `"use client"` — do NOT add `force-dynamic`
- Supabase cookie pattern: use `getAll()`/`setAll()` (not old `get`/`set`/`delete`)
- Stripe SDK: do NOT pass `apiVersion` — just `new Stripe(key)`
- palettai uses `@google/generative-ai` with `gemini-2.0-flash` (free tier: 1k req/day)

## Database
Full schema at `E:/Projects/Websites/.claude/database-schema.sql`
Run in Supabase SQL editor for new environments.
