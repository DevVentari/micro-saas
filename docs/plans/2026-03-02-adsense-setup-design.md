# AdSense Setup Design

## Overview

Activate Google AdSense across all three Websites apps (invoicely.ventar.pro, metatagz.ventar.pro, palettai.com) using the existing `AdSenseScript` + `AdBanner` infrastructure. Approach: Auto Ads (via `AdSenseScript`) + manual ad units (via `AdBanner`). Ads hidden for Pro subscribers on all three apps.

## Domain & Account Setup (manual — outside codebase)

1. Create a Google AdSense account at adsense.google.com
2. Add two sites:
   - `ventar.pro` — covers invoicely.ventar.pro and metatagz.ventar.pro
   - `palettai.com`
3. Google will issue a publisher ID: `ca-pub-XXXXXXXXXXXXXXXX`

## ads.txt Files

Each app needs `public/ads.txt` containing:
```
google.com, ca-pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

- `palettai` already has a `public/` dir
- `invoicely` and `metatagz` need `public/` dirs created

## Manual Ad Units

Create 4 ad units in the AdSense dashboard. After creation, Google provides a numeric slot ID for each (e.g. `1234567890`).

| App | Component slot prop (current) | Format | AdSense unit name |
|-----|-------------------------------|--------|-------------------|
| invoicely | `invoicely-home-bottom` | Leaderboard | Invoicely Home Bottom |
| metatagz | `metatagz-results` | Leaderboard | MetaTagz Results |
| palettai | `palettai-home-top` | Leaderboard | PalettAI Home Top |
| palettai | `palettai-home-bottom` | Banner | PalettAI Home Bottom |

Slot prop strings in code get replaced with the numeric IDs from AdSense.

## Auto Ads

No code changes needed. `AdSenseScript` already loads with `strategy="lazyOnload"`. Once `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set to a real publisher ID, Auto Ads activates automatically.

## Pro User Ad Gating

All three apps hide ads for active Pro subscribers.

- `invoicely` — already implemented via `InvoicelyAdBanner` component
- `metatagz` — create `components/metatagz-ad-banner.tsx` (same pattern), replace direct `AdBanner` in `app/page.tsx`
- `palettai` — create `components/palettai-ad-banner.tsx` (same pattern), replace both direct `AdBanner` calls in `app/page.tsx`

Pattern (mirrors invoicely):
```tsx
"use client";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { AdBanner } from "@repo/ui";

export function MetatagzAdBanner() {
  const { user } = useAuth();
  const { isPro } = useSubscription("metatagz", user?.id);
  if (isPro) return null;
  return <AdBanner slot="NUMERIC_SLOT_ID" format="leaderboard" />;
}
```

## Env Vars

Same publisher ID across all apps. Set in two places:

**Local (`.env.local` for each app):**
```
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

**Production (Vercel environment variables for each app):**
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX`

## Implementation Order

1. Write code changes (ads.txt, Pro-gating components, slot ID updates)
2. Apply for AdSense account + add both domains
3. Once approved: get publisher ID + create 4 ad units, get slot IDs
4. Fill in publisher ID and slot IDs in code/env vars
5. Deploy to Vercel
