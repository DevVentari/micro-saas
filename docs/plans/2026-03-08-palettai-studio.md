# PalettAI Studio Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/studio` page to palettai.com that expands a generated palette into a full UI prep suite — shade scales, moodboard, style card, and component preview.

**Architecture:** Keep the homepage palette generator unchanged. After generating, an "Open in Studio" button stores the palette in `sessionStorage` and navigates to `/studio`. The studio page is a client component that reads palette from `sessionStorage` (free users) or fetches by Supabase ID (Pro users after auto-save). Four tab sections render independently — shades (client-side, instant), moodboard (Unsplash + DALL-E), style card (OpenAI + Google Fonts), component preview (client-side). Moodboard/style card/components are blurred for free users with a Pro upgrade CTA overlay.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, `unsplash-js`, `html-to-image`, OpenAI (existing), Supabase (existing), Google Fonts CSS API

---

## Codebase Context

- App root: `E:/Projects/Websites/apps/palettai/`
- Existing color utils: `lib/color-utils.ts` — `generateShades(hex)` returns 9 hex strings (lightness 95→20), `hexToHsl`, `getContrastColor`
- Existing export utils: `lib/export.ts` — `toCssVariables`, `toTailwindConfig`, `toFigmaJson`, `toJsonArray`
- Existing AI types: `lib/ai.ts` — `GeneratedPalette { paletteName, colors[{hex,name,role}], description }`
- Auth hook: `useAuth()` from `@repo/auth` — gives `user`
- Billing hook: `useSubscription("palettai", user?.id)` from `@repo/billing` — gives `isPro`
- Supabase server client pattern (see `app/api/palettes/route.ts`): `makeSupabase()` using `createServerClient` + `cookies()`
- Palette save API: `POST /api/palettes` — requires Pro, returns `{ palette: { id, name, colors, prompt } }`
- `@repo/ui` exports: `Button`, `cn`
- Run dev: `cd E:/Projects/Websites && pnpm --filter palettai dev`
- Run build: `cd E:/Projects/Websites && pnpm --filter palettai build`

---

## Task 1: Install dependencies + env vars

**Files:**
- Modify: `apps/palettai/package.json`
- Modify: `apps/palettai/.env.local`

**Step 1: Install packages**

```bash
cd E:/Projects/Websites
pnpm --filter palettai add unsplash-js html-to-image
```

Expected: both packages appear in `apps/palettai/package.json` dependencies.

**Step 2: Add env var to `.env.local`**

Append to `apps/palettai/.env.local`:
```
# Unsplash
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

Get the key at `https://unsplash.com/developers` → "New Application". Use the Access Key (not Secret Key).

**Step 3: Verify build still passes**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build
```

Expected: build completes with no errors.

**Step 4: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/package.json pnpm-lock.yaml
git commit -m "chore: add unsplash-js and html-to-image to palettai"
```

---

## Task 2: `ShadesSection` component

**Files:**
- Create: `apps/palettai/components/studio/ShadesSection.tsx`

**Context:** `generateShades(hex)` in `lib/color-utils.ts` takes a hex string and returns 9 hex strings at lightnesses [95, 90, 80, 70, 60, 50, 40, 30, 20]. We label these 50, 100, 200, 300, 400, 500, 600, 700, 800. Use `getContrastColor(hex)` to pick black or white text on each swatch. The `GeneratedPalette` type has `colors: Array<{hex, name, role}>` with roles: primary, secondary, accent, neutral, background.

**Step 1: Create the component**

Create `apps/palettai/components/studio/ShadesSection.tsx`:

```tsx
"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@repo/ui";
import { generateShades, getContrastColor } from "@/lib/color-utils";
import type { GeneratedPalette } from "@/lib/ai";

const SHADE_LABELS = ["50", "100", "200", "300", "400", "500", "600", "700", "800"];

interface ShadesSectionProps {
  palette: GeneratedPalette;
}

export function ShadesSection({ palette }: ShadesSectionProps) {
  const [copied, setCopied] = React.useState<string | null>(null);

  function handleCopy(hex: string) {
    navigator.clipboard.writeText(hex).then(() => {
      setCopied(hex);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Shade Scales</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Full 9-step scale for each palette role. Click any swatch to copy its hex.
        </p>
      </div>

      <div className="space-y-4">
        {palette.colors.map((color) => {
          const shades = generateShades(color.hex);
          return (
            <div key={color.role}>
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="inline-block size-3 rounded-full border border-border/50"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-sm font-medium capitalize text-foreground">
                  {color.role}
                </span>
                <span className="text-xs text-muted-foreground">— {color.name}</span>
              </div>
              <div className="flex rounded-xl overflow-hidden border border-border">
                {shades.map((shade, i) => {
                  const label = SHADE_LABELS[i];
                  const textColor = getContrastColor(shade);
                  const isCopied = copied === shade;
                  return (
                    <button
                      key={label}
                      className={cn(
                        "group flex-1 flex flex-col items-center justify-end py-3 px-1 transition-all",
                        "hover:flex-[1.4] focus:outline-none"
                      )}
                      style={{ backgroundColor: shade }}
                      onClick={() => handleCopy(shade)}
                      title={`${color.role}-${label}: ${shade}`}
                    >
                      <span
                        className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: textColor === "black" ? "#000" : "#fff" }}
                      >
                        {isCopied ? (
                          <Check className="size-3" />
                        ) : (
                          shade
                        )}
                      </span>
                      <span
                        className="mt-1 text-[10px] font-medium"
                        style={{ color: textColor === "black" ? "#000" : "#fff", opacity: 0.7 }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">CSS Custom Properties</span>
          <button
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => {
              const vars = palette.colors
                .flatMap((c) => {
                  const shades = generateShades(c.hex);
                  return shades.map((shade, i) => `  --${c.role}-${SHADE_LABELS[i]}: ${shade};`);
                })
                .join("\n");
              navigator.clipboard.writeText(`:root {\n${vars}\n}`);
              setCopied("css");
              setTimeout(() => setCopied(null), 1500);
            }}
          >
            {copied === "css" ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied === "css" ? "Copied!" : "Copy all"}
          </button>
        </div>
        <pre className="text-xs text-muted-foreground overflow-x-auto max-h-32">
          {palette.colors
            .slice(0, 1)
            .flatMap((c) => {
              const shades = generateShades(c.hex);
              return shades.map((shade, i) => `--${c.role}-${SHADE_LABELS[i]}: ${shade};`);
            })
            .join("\n")}
          {"\n/* + " + (palette.colors.length - 1) * 9 + " more... */"}
        </pre>
      </div>
    </div>
  );
}
```

**Step 2: Verify no TypeScript errors**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build 2>&1 | grep -E "error|Error" | head -20
```

Expected: no TypeScript errors related to this file.

**Step 3: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/components/studio/ShadesSection.tsx
git commit -m "feat: add ShadesSection component with 9-step shade scales"
```

---

## Task 3: `ProGate` blur overlay component

**Files:**
- Create: `apps/palettai/components/studio/ProGate.tsx`

**Step 1: Create the component**

Create `apps/palettai/components/studio/ProGate.tsx`:

```tsx
"use client";

import * as React from "react";
import { Lock, Zap } from "lucide-react";
import { Button } from "@repo/ui";

interface ProGateProps {
  isPro: boolean;
  children: React.ReactNode;
  featureName: string;
}

export function ProGate({ isPro, children, featureName }: ProGateProps) {
  if (isPro) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border border-border bg-background/95 shadow-xl p-6 text-center max-w-xs mx-4">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="size-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">{featureName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to Pro to unlock the full UI prep suite.
          </p>
          <Button asChild className="mt-4 w-full gap-2">
            <a href="/pricing">
              <Zap className="size-4" />
              Upgrade to Pro — $5/mo
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build 2>&1 | grep -E "^.*error" | head -10
```

Expected: no errors.

**Step 3: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/components/studio/ProGate.tsx
git commit -m "feat: add ProGate blur overlay for Pro-gated studio sections"
```

---

## Task 4: Studio page scaffold with tab navigation

**Files:**
- Create: `apps/palettai/app/studio/page.tsx`

**Context:** The studio page is a client component. It reads the palette from two sources:
1. `sessionStorage.getItem("studio_palette")` — JSON-encoded `GeneratedPalette` + `mood` string stored by the homepage before navigating
2. Fallback: `?id=<palette_id>` query param → `GET /api/palettes?id=<id>` (need to extend the palettes route, or just use the session storage approach and add a fetch later)

For now, the page reads only from `sessionStorage`. We'll add the ID fetch in a follow-up (Task 11). The tabs are: Shades, Moodboard, Style Card, Components. Sections are rendered as hidden divs (not unmounted) to preserve their loaded state when switching tabs.

**Step 1: Create the studio page**

Create `apps/palettai/app/studio/page.tsx`:

```tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Layers, Image, CreditCard, Layout } from "lucide-react";
import { cn } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { ShadesSection } from "@/components/studio/ShadesSection";
import { ProGate } from "@/components/studio/ProGate";
import type { GeneratedPalette } from "@/lib/ai";

// Lazy-load heavy sections to avoid importing html-to-image on initial load
const MoodboardSection = React.lazy(() =>
  import("@/components/studio/MoodboardSection").then((m) => ({ default: m.MoodboardSection }))
);
const StyleCardSection = React.lazy(() =>
  import("@/components/studio/StyleCardSection").then((m) => ({ default: m.StyleCardSection }))
);
const ComponentPreviewSection = React.lazy(() =>
  import("@/components/studio/ComponentPreviewSection").then((m) => ({ default: m.ComponentPreviewSection }))
);

const TABS = [
  { id: "shades", label: "Shades", icon: Layers },
  { id: "moodboard", label: "Moodboard", icon: Image },
  { id: "stylecard", label: "Style Card", icon: CreditCard },
  { id: "components", label: "Components", icon: Layout },
] as const;

type TabId = typeof TABS[number]["id"];

export default function StudioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPro } = useSubscription("palettai", user?.id);
  const [palette, setPalette] = React.useState<GeneratedPalette | null>(null);
  const [mood, setMood] = React.useState<string>("balanced");
  const [activeTab, setActiveTab] = React.useState<TabId>("shades");
  const [visitedTabs, setVisitedTabs] = React.useState<Set<TabId>>(new Set(["shades"]));

  React.useEffect(() => {
    const stored = sessionStorage.getItem("studio_palette");
    if (!stored) {
      router.replace("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { palette: GeneratedPalette; mood: string };
      setPalette(parsed.palette);
      setMood(parsed.mood ?? "balanced");
    } catch {
      router.replace("/");
    }
  }, [router]);

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    setVisitedTabs((prev) => new Set([...prev, tab]));
  }

  if (!palette) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading studio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex gap-1">
              {palette.colors.map((c) => (
                <span
                  key={c.role}
                  className="inline-block size-4 rounded-full border border-border/50"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <span className="truncate text-sm font-medium text-foreground">
              {palette.paletteName}
            </span>
          </div>
        </div>

        {/* Tab nav */}
        <div className="container">
          <div className="flex gap-0 border-t border-border/50 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8">
        {/* Always render shades (cheap, instant) */}
        <div className={activeTab === "shades" ? "block" : "hidden"}>
          <ShadesSection palette={palette} />
        </div>

        {/* Lazy sections — only mount when first visited */}
        <React.Suspense fallback={<SectionSkeleton />}>
          {visitedTabs.has("moodboard") && (
            <div className={activeTab === "moodboard" ? "block" : "hidden"}>
              <ProGate isPro={isPro} featureName="AI Moodboard">
                <MoodboardSection palette={palette} mood={mood} />
              </ProGate>
            </div>
          )}
          {visitedTabs.has("stylecard") && (
            <div className={activeTab === "stylecard" ? "block" : "hidden"}>
              <ProGate isPro={isPro} featureName="Style Card">
                <StyleCardSection palette={palette} mood={mood} />
              </ProGate>
            </div>
          )}
          {visitedTabs.has("components") && (
            <div className={activeTab === "components" ? "block" : "hidden"}>
              <ProGate isPro={isPro} featureName="Component Preview">
                <ComponentPreviewSection palette={palette} />
              </ProGate>
            </div>
          )}
        </React.Suspense>
      </main>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 rounded-lg bg-muted" />
      <div className="h-4 w-72 rounded-lg bg-muted" />
      <div className="grid grid-cols-3 gap-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify the page compiles**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build 2>&1 | grep -E "error TS" | head -20
```

Expected: TypeScript errors only for missing imports (MoodboardSection, StyleCardSection, ComponentPreviewSection — not yet created). Ignore those for now.

**Step 3: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/app/studio/
git commit -m "feat: add studio page scaffold with tab navigation"
```

---

## Task 5: Moodboard API route

**Files:**
- Create: `apps/palettai/app/api/studio/moodboard/route.ts`

**Context:**
- Unsplash JS: `import { createApi } from 'unsplash-js'`. On server, pass `fetch` explicitly: `createApi({ accessKey: '...', fetch: fetch })`
- Unsplash search: `unsplash.search.getPhotos({ query, perPage, orientation })` → check `result.type === 'success'` → `result.response.results` array → each has `.urls.regular` and `.alt_description`
- DALL-E: `POST https://api.openai.com/v1/images/generations` with `model: "dall-e-3"`, `prompt`, `n: 1`, `size: "1024x1024"` → `data[0].url`
- Run both in parallel with `Promise.allSettled`

**Step 1: Create the route**

Create `apps/palettai/app/api/studio/moodboard/route.ts`:

```ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createApi } from "unsplash-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { paletteName: string; mood: string; primaryHex: string };
    const { paletteName, mood, primaryHex } = body;

    if (!paletteName || !mood) {
      return NextResponse.json({ error: "paletteName and mood are required" }, { status: 400 });
    }

    const unsplash = createApi({
      accessKey: process.env.UNSPLASH_ACCESS_KEY!,
      fetch: fetch,
    });

    const query = `${mood} ${paletteName} aesthetic`;

    const [unsplashResult, dalleResult] = await Promise.allSettled([
      // Unsplash: 7 mood-matched photos
      unsplash.search.getPhotos({
        query,
        perPage: 7,
        orientation: "landscape",
      }),
      // DALL-E: 1 abstract hero image
      fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Abstract ${mood} color field with ${primaryHex} as the dominant color, editorial photography style, minimalist, no text, no people`,
          n: 1,
          size: "1024x1024",
        }),
        signal: AbortSignal.timeout(25000),
      }).then((r) => r.json() as Promise<{ data: Array<{ url: string }> }>),
    ]);

    const images: Array<{ url: string; source: "unsplash" | "dalle"; alt: string }> = [];

    // Add DALL-E image first (hero position)
    if (dalleResult.status === "fulfilled" && dalleResult.value?.data?.[0]?.url) {
      images.push({
        url: dalleResult.value.data[0].url,
        source: "dalle",
        alt: `AI-generated ${mood} abstract`,
      });
    }

    // Add Unsplash photos
    if (
      unsplashResult.status === "fulfilled" &&
      unsplashResult.value.type === "success"
    ) {
      for (const photo of unsplashResult.value.response.results) {
        images.push({
          url: photo.urls.regular,
          source: "unsplash",
          alt: photo.alt_description ?? query,
        });
      }
    }

    if (images.length === 0) {
      return NextResponse.json({ error: "No images could be generated" }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Verify build**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build 2>&1 | grep -E "error TS.*moodboard" | head -10
```

Expected: no errors in this file.

**Step 3: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/app/api/studio/
git commit -m "feat: add moodboard API route (Unsplash + DALL-E)"
```

---

## Task 6: `MoodboardSection` component

**Files:**
- Create: `apps/palettai/components/studio/MoodboardSection.tsx`

**Step 1: Create the component**

Create `apps/palettai/components/studio/MoodboardSection.tsx`:

```tsx
"use client";

import * as React from "react";
import type { GeneratedPalette } from "@/lib/ai";

interface MoodImage {
  url: string;
  source: "unsplash" | "dalle";
  alt: string;
}

interface MoodboardSectionProps {
  palette: GeneratedPalette;
  mood: string;
}

export function MoodboardSection({ palette, mood }: MoodboardSectionProps) {
  const [images, setImages] = React.useState<MoodImage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const primaryHex = palette.colors.find((c) => c.role === "primary")?.hex ?? palette.colors[0].hex;
    fetch("/api/studio/moodboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paletteName: palette.paletteName, mood, primaryHex }),
    })
      .then((r) => r.json() as Promise<{ images?: MoodImage[]; error?: string }>)
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setImages(data.images ?? []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load moodboard"))
      .finally(() => setLoading(false));
  }, [palette, mood]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Moodboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated imagery and curated photos matching your palette mood.
        </p>
      </div>

      {loading && <MoodboardSkeleton />}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && images.length > 0 && (
        <div
          className="columns-2 sm:columns-3 gap-3 space-y-3"
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-xl overflow-hidden border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt}
                className="w-full object-cover"
                loading="lazy"
              />
              {img.source === "dalle" && (
                <div className="px-3 py-1.5 bg-primary/10 text-[10px] text-primary font-medium">
                  AI Generated
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MoodboardSkeleton() {
  return (
    <div className="columns-2 sm:columns-3 gap-3 space-y-3 animate-pulse">
      {[180, 240, 160, 200, 220, 180, 160, 240].map((h, i) => (
        <div
          key={i}
          className="break-inside-avoid rounded-xl bg-muted"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}
```

**Step 2: Verify build**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build 2>&1 | grep "error TS" | head -10
```

**Step 3: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/components/studio/MoodboardSection.tsx
git commit -m "feat: add MoodboardSection with masonry grid"
```

---

## Task 7: Style card API route

**Files:**
- Create: `apps/palettai/app/api/studio/stylecard/route.ts`

**Context:** OpenAI call returns structured JSON with `headingFont`, `bodyFont`, `toneWords`, `usageRules`. Use `response_format: { type: "json_object" }` and the existing system prompt pattern from `lib/ai.ts`.

**Step 1: Create the route**

Create `apps/palettai/app/api/studio/stylecard/route.ts`:

```ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import type { GeneratedPalette } from "@/lib/ai";

interface StyleCardData {
  headingFont: string;
  bodyFont: string;
  toneWords: string[];
  usageRules: string[];
}

const SYSTEM_PROMPT = `You are a brand designer. Output JSON only.

Required structure:
{
  "headingFont": "string (Google Fonts name, e.g. Fraunces)",
  "bodyFont": "string (Google Fonts name, e.g. Inter)",
  "toneWords": ["word1", "word2", "word3", "word4", "word5"],
  "usageRules": ["rule1", "rule2", "rule3"]
}

Font choices must be available on Google Fonts.
Tone words should be single adjectives that describe the brand personality.
Usage rules should be short actionable guidelines for using the palette (e.g. "Use primary for CTAs only").`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { palette: GeneratedPalette; mood: string };
    const { palette, mood } = body;

    if (!palette?.paletteName) {
      return NextResponse.json({ error: "palette is required" }, { status: 400 });
    }

    const colorSummary = palette.colors
      .map((c) => `${c.role}: ${c.hex} (${c.name})`)
      .join(", ");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Palette: "${palette.paletteName}". Mood: ${mood}. Colors: ${colorSummary}. Description: ${palette.description}`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 256,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);

    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(content) as StyleCardData;

    if (
      !parsed.headingFont ||
      !parsed.bodyFont ||
      !Array.isArray(parsed.toneWords) ||
      !Array.isArray(parsed.usageRules)
    ) {
      throw new Error("Invalid style card structure from AI");
    }

    return NextResponse.json({ styleCard: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Verify build**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build 2>&1 | grep "error TS" | head -10
```

**Step 3: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/app/api/studio/stylecard/
git commit -m "feat: add style card API route (OpenAI font pairing + tone words)"
```

---

## Task 8: `StyleCardSection` component + PNG export

**Files:**
- Create: `apps/palettai/components/studio/StyleCardSection.tsx`

**Context:**
- Google Fonts: inject `<link href="https://fonts.googleapis.com/css2?family=FONT_NAME:wght@400;700&display=swap">` dynamically using `document.head.appendChild`. Replace spaces with `+` in font names.
- `html-to-image`: `import { toPng } from 'html-to-image'`. Call `toPng(element)` where `element` is a `RefObject<HTMLDivElement>`. Returns a data URL. Download via `<a download>`.
- The style card `ref` div is what gets exported — keep it self-contained with inline styles so html-to-image captures fonts correctly.

**Step 1: Create the component**

Create `apps/palettai/components/studio/StyleCardSection.tsx`:

```tsx
"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@repo/ui";
import type { GeneratedPalette } from "@/lib/ai";
import { getContrastColor } from "@/lib/color-utils";

interface StyleCardData {
  headingFont: string;
  bodyFont: string;
  toneWords: string[];
  usageRules: string[];
}

interface StyleCardSectionProps {
  palette: GeneratedPalette;
  mood: string;
}

function loadGoogleFont(fontName: string) {
  const id = `gfont-${fontName.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

export function StyleCardSection({ palette, mood }: StyleCardSectionProps) {
  const [data, setData] = React.useState<StyleCardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    fetch("/api/studio/stylecard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palette, mood }),
    })
      .then((r) => r.json() as Promise<{ styleCard?: StyleCardData; error?: string }>)
      .then((d) => {
        if (d.error) throw new Error(d.error);
        if (d.styleCard) {
          setData(d.styleCard);
          loadGoogleFont(d.styleCard.headingFont);
          loadGoogleFont(d.styleCard.bodyFont);
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load style card"))
      .finally(() => setLoading(false));
  }, [palette, mood]);

  async function handleExport() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${palette.paletteName.replace(/\s/g, "-")}-style-card.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  const primary = palette.colors.find((c) => c.role === "primary")?.hex ?? "#000";
  const background = palette.colors.find((c) => c.role === "background")?.hex ?? "#fff";
  const neutral = palette.colors.find((c) => c.role === "neutral")?.hex ?? "#e5e7eb";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Style Card</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand brief with typography pairing and usage guidelines.
          </p>
        </div>
        {data && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="gap-2"
          >
            <Download className="size-4" />
            {exporting ? "Exporting..." : "Download PNG"}
          </Button>
        )}
      </div>

      {loading && <StyleCardSkeleton />}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && (
        <div
          ref={cardRef}
          className="rounded-2xl overflow-hidden border border-border shadow-sm"
          style={{ backgroundColor: background, fontFamily: data.bodyFont }}
        >
          {/* Color strip */}
          <div className="flex h-16">
            {palette.colors.map((c) => (
              <div key={c.role} className="flex-1" style={{ backgroundColor: c.hex }} />
            ))}
          </div>

          {/* Card body */}
          <div className="p-8 space-y-8">
            {/* Palette name + description */}
            <div>
              <h2
                className="text-3xl font-bold"
                style={{
                  fontFamily: data.headingFont,
                  color: getContrastColor(background) === "black" ? "#111" : "#f9f9f9",
                }}
              >
                {palette.paletteName}
              </h2>
              <p
                className="mt-2 text-sm leading-relaxed max-w-lg"
                style={{ color: getContrastColor(background) === "black" ? "#555" : "#aaa" }}
              >
                {palette.description}
              </p>
            </div>

            {/* Typography preview */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: primary }}>
                  Heading Font
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ fontFamily: data.headingFont, color: getContrastColor(background) === "black" ? "#111" : "#f9f9f9" }}
                >
                  {data.headingFont}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ fontFamily: data.headingFont, color: getContrastColor(background) === "black" ? "#555" : "#aaa" }}
                >
                  The quick brown fox
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest mb-2" style={{ color: primary }}>
                  Body Font
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ fontFamily: data.bodyFont, color: getContrastColor(background) === "black" ? "#111" : "#f9f9f9" }}
                >
                  {data.bodyFont}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ fontFamily: data.bodyFont, color: getContrastColor(background) === "black" ? "#555" : "#aaa" }}
                >
                  The quick brown fox
                </p>
              </div>
            </div>

            {/* Tone words */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                Tone
              </p>
              <div className="flex flex-wrap gap-2">
                {data.toneWords.map((word) => (
                  <span
                    key={word}
                    className="rounded-full px-3 py-1 text-sm font-medium"
                    style={{
                      backgroundColor: neutral,
                      color: getContrastColor(neutral) === "black" ? "#111" : "#f9f9f9",
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Usage rules */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                Usage Guidelines
              </p>
              <ul className="space-y-2">
                {data.usageRules.map((rule, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: getContrastColor(background) === "black" ? "#555" : "#aaa" }}
                  >
                    <span
                      className="mt-0.5 size-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: primary }}
                    />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Colour swatches row */}
            <div>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: primary }}>
                Colours
              </p>
              <div className="flex gap-3 flex-wrap">
                {palette.colors.map((c) => (
                  <div key={c.role} className="flex items-center gap-2">
                    <span
                      className="inline-block size-5 rounded-full border border-black/10"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div>
                      <p
                        className="text-xs font-mono"
                        style={{ color: getContrastColor(background) === "black" ? "#111" : "#f9f9f9" }}
                      >
                        {c.hex}
                      </p>
                      <p
                        className="text-[10px] capitalize"
                        style={{ color: getContrastColor(background) === "black" ? "#999" : "#666" }}
                      >
                        {c.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StyleCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="h-16 bg-muted" />
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-full rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-20 rounded-lg bg-muted" />
          <div className="h-20 rounded-lg bg-muted" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build 2>&1 | grep "error TS" | head -10
```

**Step 3: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/components/studio/StyleCardSection.tsx
git commit -m "feat: add StyleCardSection with Google Fonts + PNG export"
```

---

## Task 9: `ComponentPreviewSection` component

**Files:**
- Create: `apps/palettai/components/studio/ComponentPreviewSection.tsx`

**Context:** Inject palette as CSS custom properties onto a wrapper div using `style` prop. Render static components using those vars. No API calls.

**Step 1: Create the component**

Create `apps/palettai/components/studio/ComponentPreviewSection.tsx`:

```tsx
"use client";

import * as React from "react";
import type { GeneratedPalette } from "@/lib/ai";
import { getContrastColor } from "@/lib/color-utils";

interface ComponentPreviewSectionProps {
  palette: GeneratedPalette;
}

export function ComponentPreviewSection({ palette }: ComponentPreviewSectionProps) {
  const primary = palette.colors.find((c) => c.role === "primary")?.hex ?? "#6d28d9";
  const secondary = palette.colors.find((c) => c.role === "secondary")?.hex ?? "#7c3aed";
  const accent = palette.colors.find((c) => c.role === "accent")?.hex ?? "#a78bfa";
  const neutral = palette.colors.find((c) => c.role === "neutral")?.hex ?? "#e5e7eb";
  const background = palette.colors.find((c) => c.role === "background")?.hex ?? "#fff";

  const primaryText = getContrastColor(primary) === "black" ? "#111" : "#fff";
  const bgText = getContrastColor(background) === "black" ? "#111" : "#fff";

  const cssVars: React.CSSProperties = {
    "--preview-primary": primary,
    "--preview-secondary": secondary,
    "--preview-accent": accent,
    "--preview-neutral": neutral,
    "--preview-background": background,
    "--preview-primary-text": primaryText,
    "--preview-bg-text": bgText,
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Component Preview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Common UI components rendered in your palette.
        </p>
      </div>

      <div style={cssVars} className="space-y-6">
        {/* Buttons */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Buttons</h3>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: primary, color: primaryText }}
            >
              Primary Action
            </button>
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium border-2 transition-opacity hover:opacity-80"
              style={{ borderColor: primary, color: primary, backgroundColor: "transparent" }}
            >
              Ghost Button
            </button>
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: secondary, color: getContrastColor(secondary) === "black" ? "#111" : "#fff" }}
            >
              Secondary
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {palette.colors.map((c) => (
              <span
                key={c.role}
                className="rounded-full px-3 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: c.hex,
                  color: getContrastColor(c.hex) === "black" ? "#111" : "#fff",
                }}
              >
                {c.role}
              </span>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input Field</h3>
          <div className="max-w-sm space-y-1.5">
            <label className="text-sm font-medium" style={{ color: bgText }}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              readOnly
              className="w-full rounded-lg px-3 py-2 text-sm border-2 outline-none"
              style={{
                borderColor: primary,
                backgroundColor: background,
                color: bgText,
              }}
            />
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Alerts</h3>
          <div
            className="rounded-lg px-4 py-3 text-sm border-l-4"
            style={{ borderColor: accent, backgroundColor: `${accent}22`, color: bgText }}
          >
            <strong>Success:</strong> Your palette has been saved successfully.
          </div>
          <div
            className="rounded-lg px-4 py-3 text-sm border-l-4"
            style={{ borderColor: "#ef4444", backgroundColor: "#fee2e2", color: "#991b1b" }}
          >
            <strong>Error:</strong> Something went wrong. Please try again.
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Card</h3>
          <div
            className="rounded-xl border overflow-hidden max-w-sm shadow-sm"
            style={{ borderColor: neutral, backgroundColor: background }}
          >
            <div className="h-24" style={{ backgroundColor: primary }} />
            <div className="p-4 space-y-2">
              <h4 className="font-semibold" style={{ color: bgText }}>
                {palette.paletteName}
              </h4>
              <p className="text-sm" style={{ color: getContrastColor(background) === "black" ? "#666" : "#aaa" }}>
                {palette.description.slice(0, 80)}…
              </p>
              <button
                className="mt-2 rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{ backgroundColor: primary, color: primaryText }}
              >
                View Palette
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build 2>&1 | grep "error TS" | head -10
```

**Step 3: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/components/studio/ComponentPreviewSection.tsx
git commit -m "feat: add ComponentPreviewSection with live palette rendering"
```

---

## Task 10: Update `PaletteDisplay` — "Open in Studio" button

**Files:**
- Modify: `apps/palettai/components/palette-display.tsx`
- Modify: `apps/palettai/app/page.tsx`

**Context:** `PaletteDisplay` needs two new props: `mood` (the mood string from `PromptInput`) and `onOpenStudio` (callback). The homepage already calls `applyPalette(newPalette, mood)` in `handleGenerated` — we have `mood` available there. When the user clicks "Open in Studio":
1. Store `JSON.stringify({ palette, mood })` in `sessionStorage` under key `"studio_palette"`
2. Navigate to `/studio` using `window.location.href = "/studio"` (simple, avoids Next.js router complexity with sessionStorage timing)

**Step 1: Update `PaletteDisplay` props**

In `apps/palettai/components/palette-display.tsx`:

Add `mood` and `onOpenStudio` to the interface:
```ts
interface PaletteDisplayProps {
  palette: GeneratedPalette;
  onRegenerate?: () => void;
  onSave?: () => void;
  onOpenStudio?: () => void;   // ← add
  mood?: string;               // ← add (unused in component, passed through)
  isSaving?: boolean;
  isPro?: boolean;
  isLoggedIn?: boolean;
  className?: string;
}
```

Add the "Open in Studio" button after the ExportMenu in the header actions area (after line 85, before ExportMenu):
```tsx
import { ExternalLink } from "lucide-react";  // add to imports

// In the button group (after ExportMenu):
{onOpenStudio && (
  <Button
    variant="outline"
    size="sm"
    onClick={onOpenStudio}
    className="flex items-center gap-2"
  >
    <ExternalLink className="w-4 h-4" />
    <span className="hidden sm:inline">Studio</span>
  </Button>
)}
```

**Step 2: Update `app/page.tsx` to wire up `onOpenStudio`**

In `apps/palettai/app/page.tsx`:

Store mood in state alongside palette:
```ts
const [currentMood, setCurrentMood] = React.useState<string>("balanced");
```

Update `handleGenerated`:
```ts
function handleGenerated(newPalette: GeneratedPalette, newRemaining: number, mood: string) {
  setPalette(newPalette);
  setCurrentMood(mood);       // ← add
  setRemaining(newRemaining);
  setError(null);
  setSaveMessage(null);
  applyPalette(newPalette, mood);
  setTimeout(() => {
    paletteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}
```

Add `handleOpenStudio`:
```ts
function handleOpenStudio() {
  if (!palette) return;
  sessionStorage.setItem("studio_palette", JSON.stringify({ palette, mood: currentMood }));
  window.location.href = "/studio";
}
```

Pass to `PaletteDisplay`:
```tsx
<PaletteDisplay
  palette={palette}
  onRegenerate={() => setPalette(null)}
  onSave={handleSave}
  onOpenStudio={handleOpenStudio}   // ← add
  mood={currentMood}                 // ← add
  isSaving={isSaving}
  isPro={isPro}
  isLoggedIn={!!user}
/>
```

**Step 3: Verify build**

```bash
cd E:/Projects/Websites && pnpm --filter palettai build 2>&1 | grep "error TS" | head -20
```

Expected: clean build.

**Step 4: Smoke test locally**

```bash
cd E:/Projects/Websites && pnpm --filter palettai dev
```

1. Open `http://localhost:3001`
2. Generate a palette
3. Click "Studio" button — should navigate to `/studio`
4. Studio page should load with the palette, Shades tab active
5. Click "Moodboard" tab — if Pro, images should load; if free, see blur overlay
6. Click "Style Card" tab — font card should render with Google Fonts

**Step 5: Commit**

```bash
cd E:/Projects/Websites
git add apps/palettai/components/palette-display.tsx apps/palettai/app/page.tsx
git commit -m "feat: add Open in Studio button to PaletteDisplay"
```

---

## Task 11: Deploy + Vercel env var

**Step 1: Add `UNSPLASH_ACCESS_KEY` to Vercel**

```bash
TOKEN="vca_3crBqRIk5mxIwT0eDKruTdZkwZ5kCgBSOUaZkcD9eyix2HUyA51D6S49"
TEAM_ID="blakes-projects-afd12cfa"
PROJECT_ID="prj_HkIqSLVVE0bXDjSwsmR1AwpPh2Kg"

curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID&upsert=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"UNSPLASH_ACCESS_KEY","value":"YOUR_REAL_KEY_HERE","type":"encrypted","target":["production","preview","development"]}'
```

Replace `YOUR_REAL_KEY_HERE` with the actual Unsplash Access Key.

**Step 2: Push and deploy**

```bash
cd E:/Projects/Websites
git push
```

Vercel will auto-deploy. Monitor at `https://vercel.com/blakes-projects-afd12cfa/micro-saas-palettai`.

**Step 3: Smoke test production**

1. Go to `https://palettai.com`
2. Generate "Midnight Tokyo tech" palette with mood "dark"
3. Click "Studio" → verify shades render
4. (Pro account) Verify moodboard loads Unsplash photos + DALL-E image
5. (Pro account) Verify style card renders with Google Fonts, download PNG works
6. (Free account) Verify moodboard/style card/components show blur + "Upgrade to Pro" CTA

**Step 4: Final commit if any fixes needed**

```bash
cd E:/Projects/Websites
git add -A
git commit -m "fix: production smoke test fixes for studio"
git push
```
