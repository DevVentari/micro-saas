# AdSense Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Activate Google AdSense across invoicely.ventar.pro, metatagz.ventar.pro, and palettai.com with Auto Ads + 4 manual ad units, hidden for Pro subscribers.

**Architecture:** `AdSenseScript` in each layout loads the AdSense JS (Auto Ads). Four `AdBanner` components in pages handle manual placements. All ad slots already gated behind `!isPro`. Infrastructure is complete — remaining work is `ads.txt` verification files and wiring in real IDs once AdSense approves.

**Tech Stack:** Next.js 14 App Router, `@repo/ui` (AdSenseScript, AdBanner), pnpm monorepo

---

## Phase 1 — Code (do now, before AdSense approval)

### Task 1: Create ads.txt for invoicely

**Files:**
- Create: `apps/invoicely/public/ads.txt`

**Step 1: Create the public directory and ads.txt**

```
google.com, ca-pub-PLACEHOLDER, DIRECT, f08c47fec0942fa0
```

Create `apps/invoicely/public/ads.txt` with that content. Replace `ca-pub-PLACEHOLDER` once publisher ID is known.

**Step 2: Commit**

```bash
cd E:/Projects/Websites
git add apps/invoicely/public/ads.txt
git commit -m "feat: add ads.txt for invoicely"
```

---

### Task 2: Create ads.txt for metatagz

**Files:**
- Create: `apps/metatagz/public/ads.txt`

**Step 1: Create ads.txt**

Same content as Task 1. `apps/metatagz/public/ads.txt`:
```
google.com, ca-pub-PLACEHOLDER, DIRECT, f08c47fec0942fa0
```

**Step 2: Commit**

```bash
git add apps/metatagz/public/ads.txt
git commit -m "feat: add ads.txt for metatagz"
```

---

### Task 3: Create ads.txt for palettai

**Files:**
- Create: `apps/palettai/public/ads.txt`

`apps/palettai/public/` already exists. Add `ads.txt`:
```
google.com, ca-pub-PLACEHOLDER, DIRECT, f08c47fec0942fa0
```

**Step 2: Commit**

```bash
git add apps/palettai/public/ads.txt
git commit -m "feat: add ads.txt for palettai"
```

---

## Phase 2 — AdSense Account (manual, outside codebase)

1. Go to https://adsense.google.com → create account
2. Add site `ventar.pro` — this covers invoicely.ventar.pro and metatagz.ventar.pro
3. Add site `palettai.com`
4. Follow the verification steps (Google will check for ads.txt)
5. Once approved, note your **publisher ID**: `ca-pub-XXXXXXXXXXXXXXXX`
6. Create 4 manual ad units in AdSense → Ads → By ad unit → Display ads:
   - "Invoicely Home Bottom" (leaderboard) → note slot ID
   - "MetaTagz Results" (leaderboard) → note slot ID
   - "PalettAI Home Top" (leaderboard) → note slot ID
   - "PalettAI Home Bottom" (banner) → note slot ID

---

## Phase 3 — Wire in IDs (after AdSense approval)

### Task 4: Update ads.txt with real publisher ID

**Files:**
- Modify: `apps/invoicely/public/ads.txt`
- Modify: `apps/metatagz/public/ads.txt`
- Modify: `apps/palettai/public/ads.txt`

Replace `ca-pub-PLACEHOLDER` with your real publisher ID in all three files.

**Commit:**
```bash
git add apps/invoicely/public/ads.txt apps/metatagz/public/ads.txt apps/palettai/public/ads.txt
git commit -m "feat: set adsense publisher ID in ads.txt"
```

---

### Task 5: Update slot IDs in code

**Files:**
- Modify: `apps/invoicely/components/invoicely-ad-banner.tsx:12`
- Modify: `apps/metatagz/app/page.tsx:227`
- Modify: `apps/palettai/app/page.tsx:234`
- Modify: `apps/palettai/app/page.tsx:363`

Replace the descriptive slot strings with the numeric slot IDs from AdSense:

`apps/invoicely/components/invoicely-ad-banner.tsx`:
```tsx
return <AdBanner slot="INVOICELY_HOME_BOTTOM_SLOT_ID" format="leaderboard" />;
```

`apps/metatagz/app/page.tsx`:
```tsx
<AdBanner slot="METATAGZ_RESULTS_SLOT_ID" format="leaderboard" />
```

`apps/palettai/app/page.tsx` (two spots):
```tsx
<AdBanner slot="PALETTAI_HOME_TOP_SLOT_ID" format="leaderboard" />
<AdBanner slot="PALETTAI_HOME_BOTTOM_SLOT_ID" format="banner" />
```

**Commit:**
```bash
git add apps/invoicely/components/invoicely-ad-banner.tsx apps/metatagz/app/page.tsx apps/palettai/app/page.tsx
git commit -m "feat: set adsense slot IDs"
```

---

### Task 6: Set env vars — local

**Files:**
- Modify: `apps/invoicely/.env.local`
- Modify: `apps/metatagz/.env.local`
- Modify: `apps/palettai/.env.local`

In each `.env.local`, replace:
```
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-placeholder
```
with:
```
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

Do NOT commit `.env.local` files.

---

### Task 7: Set env vars — Vercel (production)

In Vercel dashboard for each app (invoicely, metatagz, palettai):
- Settings → Environment Variables
- Add or update: `NEXT_PUBLIC_ADSENSE_CLIENT_ID` = `ca-pub-XXXXXXXXXXXXXXXX`
- Scope: Production (and Preview if desired)
- Redeploy each app after setting

---

## Notes

- **Pro users:** Ads already hidden for Pro subscribers on all three apps — no changes needed
- **Auto Ads:** Activates automatically once `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is a real publisher ID — no code changes needed
- **Slot ID format:** Must be numeric (e.g. `1234567890`), not descriptive strings — AdSense won't serve ads to descriptive strings
- **ads.txt location:** Must be at domain root — Next.js `public/` files are served at root, so `public/ads.txt` → `invoicely.ventar.pro/ads.txt`
