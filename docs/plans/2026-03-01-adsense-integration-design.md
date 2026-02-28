# AdSense Integration Design

**Date:** 2026-03-01
**Status:** Approved

## Context

Three micro-SaaS apps (invoicely, metatagz, palettai) are deployed on Vercel. The `AdBanner` component in `@repo/ui` is already built and placed in all 3 apps. AdSense approval is pending (custom domains not yet purchased). Goal: wire up all code now so that when approval arrives, only env vars + slot IDs need updating.

## What Already Exists

- `packages/ui/src/ad-banner.tsx` — renders `<ins class="adsbygoogle">`, shows placeholder in dev
- `AdBanner` already placed in all 3 apps with descriptive slot names
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-placeholder` in all `.env.local` files

## What's Missing

1. AdSense `<script>` tag not loaded in any layout
2. No paid-tier ad hiding logic
3. Slot IDs are placeholder strings (will become numeric IDs from AdSense dashboard)
4. Vercel env vars not set to real values (no real publisher ID yet)

## Design Decisions

### 1. AdSense Script — Shared `<AdSenseScript>` component

Create `packages/ui/src/adsense-script.tsx`:
- Uses Next.js `<Script strategy="afterInteractive">` to load `adsbygoogle.js`
- Reads publisher ID from `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
- Renders nothing if env var is not set (safe for dev/pre-approval)
- Added to all 3 app `layout.tsx` files

### 2. Paid-Tier Ad Hiding — `<ProAwareAdBanner>` wrapper

Create `packages/ui/src/pro-aware-ad-banner.tsx`:
- Wraps `AdBanner`, imports `useSubscription` from `@repo/billing`
- If user has active Pro subscription → renders `null`
- If free user or not logged in → renders `<AdBanner>` normally
- Exported from `@repo/ui` index as drop-in replacement
- All 3 apps swap `AdBanner` → `ProAwareAdBanner`

### 3. Slot IDs — Keep descriptive placeholders

Current slots are clearly named (`invoicely-home-bottom`, `metatagz-results`, etc.). When AdSense is approved:
1. Create ad units in AdSense dashboard matching these names
2. Copy numeric slot IDs into each `slot` prop
3. Set real `NEXT_PUBLIC_ADSENSE_CLIENT_ID` in Vercel env vars

## Launch Checklist (for later)

- [ ] Buy custom domains (Namecheap/Porkbun, ~$10-15/yr each)
- [ ] Point domains to Vercel
- [ ] Apply for AdSense at adsense.google.com with real domain
- [ ] After approval: create ad units, copy slot IDs
- [ ] Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX` in Vercel for each app
- [ ] Redeploy
