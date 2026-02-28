# AdSense Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up all AdSense plumbing (script loading + Pro-tier ad hiding) so that when a publisher ID and slot IDs arrive, only env vars need updating.

**Architecture:** Add a shared `AdSenseScript` component to `@repo/ui` that loads `adsbygoogle.js` in each app's layout. Fix invoicely's unconditional `AdBanner` by wrapping it in a local client component that hides ads for Pro subscribers. metatagz and palettai already have the `!isPro` guard in place.

**Tech Stack:** Next.js Script component, `@repo/ui`, `@repo/auth`, `@repo/billing`

---

## Current State

- `packages/ui/src/ad-banner.tsx` — renders `<ins>` tag, dev placeholder when no client ID ✅
- metatagz + palettai pages — already use `useSubscription` + `{!isPro && <AdBanner />}` ✅
- invoicely page — server component with unconditional `<AdBanner>` — needs fix ❌
- All 3 layouts — missing `<Script>` to load `adsbygoogle.js` ❌

---

### Task 1: Create `AdSenseScript` component in `@repo/ui`

**Files:**
- Create: `packages/ui/src/adsense-script.tsx`

**Step 1: Create the file**

```tsx
import Script from "next/script";

export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId || clientId === "ca-pub-placeholder") return null;
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
```

Note: Returns `null` when env var is missing or still set to `ca-pub-placeholder` — safe in dev and pre-approval prod.

**Step 2: Export from `packages/ui/src/index.ts`**

Add this line to `packages/ui/src/index.ts`:
```ts
export { AdSenseScript } from "./adsense-script";
```

**Step 3: Add export path to `packages/ui/package.json`**

In the `"exports"` object, add:
```json
"./adsense-script": "./src/adsense-script.tsx"
```

---

### Task 2: Add `AdSenseScript` to all 3 app layouts

**Files:**
- Modify: `apps/invoicely/app/layout.tsx`
- Modify: `apps/metatagz/app/layout.tsx`
- Modify: `apps/palettai/app/layout.tsx`

**Step 1: Update invoicely layout**

In `apps/invoicely/app/layout.tsx`:

Add import at the top:
```tsx
import { AdSenseScript } from "@repo/ui";
```

Add `<AdSenseScript />` inside `<head>` (add a `<head>` element before `<body>` if not present):
```tsx
return (
  <html lang="en">
    <head>
      <AdSenseScript />
    </head>
    <body className={inter.className}>
      ...
    </body>
  </html>
);
```

**Step 2: Update metatagz layout** — same pattern as invoicely

**Step 3: Update palettai layout** — same pattern as invoicely

---

### Task 3: Fix invoicely — create `InvoicelyAdBanner` client component

invoicely's `app/page.tsx` is a server component (no `"use client"`). It renders `<AdBanner>` unconditionally. The fix: extract the ad into a local client component that checks the subscription.

**Files:**
- Create: `apps/invoicely/components/invoicely-ad-banner.tsx`
- Modify: `apps/invoicely/app/page.tsx`

**Step 1: Create the client component**

```tsx
"use client";

import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { AdBanner } from "@repo/ui";

export function InvoicelyAdBanner() {
  const { user } = useAuth();
  const { isPro } = useSubscription("invoicely", user?.id);
  if (isPro) return null;
  return <AdBanner slot="invoicely-home-bottom" format="leaderboard" />;
}
```

**Step 2: Update `apps/invoicely/app/page.tsx`**

Replace:
```tsx
import { AdBanner } from "@repo/ui";
```
With:
```tsx
import { InvoicelyAdBanner } from "@/components/invoicely-ad-banner";
```

Replace:
```tsx
<AdBanner slot="invoicely-home-bottom" format="leaderboard" />
```
With:
```tsx
<InvoicelyAdBanner />
```

---

### Task 4: Verify the build and commit

**Step 1: Run build**

From `E:/Projects/Websites`:
```bash
pnpm run build
```
Expected: all 3 apps build with no errors.

**Step 2: Commit**

```bash
git add packages/ui/src/adsense-script.tsx packages/ui/src/index.ts packages/ui/package.json apps/invoicely/app/layout.tsx apps/invoicely/components/invoicely-ad-banner.tsx apps/invoicely/app/page.tsx apps/metatagz/app/layout.tsx apps/palettai/app/layout.tsx
git commit -m "feat: wire up AdSense script loading and Pro-tier ad hiding"
```

---

## After AdSense Approval (future steps)

1. Go to AdSense dashboard → Ads → Ad units → create one unit per slot:
   - `invoicely-home-bottom` → copy numeric slot ID
   - `metatagz-results` → copy numeric slot ID
   - `palettai-home-top` + `palettai-home-bottom` → copy numeric slot IDs
2. Update slot props in each page with real numeric IDs
3. Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX` in Vercel for each app
4. Redeploy
