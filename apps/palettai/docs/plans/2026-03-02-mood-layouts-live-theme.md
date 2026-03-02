# Mood Layouts + Live Theme Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give each mood a full layout personality (spacing, radius, typography), update the theme live on color drag pointer-up, and replace all hardcoded amber/orange with CSS variable references.

**Architecture:** Mood tokens are CSS custom properties injected into the same `<style>` block as palette color vars, keyed on `html[data-palette-active]`. A new `buildMoodVars()` function in `lib/mood-layout.ts` produces the token lines; `buildStyleContent` in `lib/palette-theme.ts` gains an optional `mood` parameter to include them. The provider stores `{ colors, mood }` in localStorage. `ColorCard` gains an `onDragEnd` callback; `PaletteDisplay` calls `updatePaletteColors` on it. All hardcoded `amber-*`/`orange-*` Tailwind classes switch to `primary`/`accent` CSS variable equivalents.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS (colors already configured as `hsl(var(--primary))` etc. in shared config). No new packages.

---

### Task 1: Create `lib/mood-layout.ts`

**Files:**
- Create: `apps/palettai/lib/mood-layout.ts`

**Step 1: Create the file**

```typescript
export type MoodName =
  | "Professional"
  | "Playful"
  | "Elegant"
  | "Nature"
  | "Tech"
  | "Warm"
  | "Cool"
  | "Bold";

interface MoodTokens {
  radius: string;
  heroPy: string;
  sectionPy: string;
  cardP: string;
  fontScale: number;
  tracking: string;
  weight: number;
  heroMax: string;
}

const MOOD_TOKENS: Record<MoodName, MoodTokens> = {
  Professional: { radius: "0.375rem", heroPy: "5rem",  sectionPy: "3rem", cardP: "1.5rem",  fontScale: 1.0,  tracking: "-0.025em", weight: 600, heroMax: "48rem" },
  Playful:      { radius: "1.5rem",   heroPy: "8rem",  sectionPy: "5rem", cardP: "2rem",    fontScale: 1.15, tracking: "0em",      weight: 700, heroMax: "56rem" },
  Elegant:      { radius: "0.75rem",  heroPy: "10rem", sectionPy: "5rem", cardP: "2rem",    fontScale: 0.95, tracking: "0.05em",   weight: 300, heroMax: "40rem" },
  Nature:       { radius: "1rem",     heroPy: "7rem",  sectionPy: "4rem", cardP: "1.75rem", fontScale: 1.0,  tracking: "0em",      weight: 400, heroMax: "48rem" },
  Tech:         { radius: "0.125rem", heroPy: "4rem",  sectionPy: "3rem", cardP: "1.25rem", fontScale: 0.9,  tracking: "0.04em",   weight: 500, heroMax: "52rem" },
  Warm:         { radius: "1.25rem",  heroPy: "6rem",  sectionPy: "4rem", cardP: "1.75rem", fontScale: 1.0,  tracking: "0em",      weight: 500, heroMax: "48rem" },
  Cool:         { radius: "0.25rem",  heroPy: "8rem",  sectionPy: "4rem", cardP: "1.75rem", fontScale: 0.9,  tracking: "0.08em",   weight: 300, heroMax: "44rem" },
  Bold:         { radius: "0.25rem",  heroPy: "9rem",  sectionPy: "5rem", cardP: "2rem",    fontScale: 1.25, tracking: "-0.04em",  weight: 900, heroMax: "64rem" },
};

export function getMoodTokens(mood: string): MoodTokens {
  return MOOD_TOKENS[mood as MoodName] ?? MOOD_TOKENS.Professional;
}

export function buildMoodVars(mood: string): string {
  const t = getMoodTokens(mood);
  return [
    `  --mood-radius: ${t.radius};`,
    `  --mood-hero-py: ${t.heroPy};`,
    `  --mood-section-py: ${t.sectionPy};`,
    `  --mood-card-p: ${t.cardP};`,
    `  --mood-font-scale: ${t.fontScale};`,
    `  --mood-tracking: ${t.tracking};`,
    `  --mood-weight: ${t.weight};`,
    `  --mood-hero-max: ${t.heroMax};`,
  ].join("\n");
}
```

**Step 2: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/lib/mood-layout.ts
git commit -m "feat(palettai): add mood layout token definitions"
```

---

### Task 2: Extend `lib/palette-theme.ts` to include mood vars

**Files:**
- Modify: `apps/palettai/lib/palette-theme.ts`

**Step 1: Add import at top of file (after existing imports on line 2)**

```typescript
import { buildMoodVars } from "./mood-layout";
```

**Step 2: Update `buildStyleContent` signature and body (lines 99–106)**

Replace the entire `buildStyleContent` function:

```typescript
export function buildStyleContent(light: ThemeVars, dark: ThemeVars, mood?: string): string {
  const toRule = (vars: ThemeVars) =>
    Object.entries(vars)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join("\n");

  const moodVars = mood ? `\n${buildMoodVars(mood)}` : "";

  return `html[data-palette-active] {\n${toRule(light)}${moodVars}\n}\nhtml[data-palette-active].dark {\n${toRule(dark)}\n}`;
}
```

**Step 3: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

Expected: No errors. The `mood` parameter is optional so existing call sites still compile.

**Step 4: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/lib/palette-theme.ts
git commit -m "feat(palettai): extend buildStyleContent to inject mood layout tokens"
```

---

### Task 3: Extend `components/palette-theme-provider.tsx`

**Files:**
- Modify: `apps/palettai/components/palette-theme-provider.tsx`

**Step 1: Read the current file, then replace it entirely with:**

```typescript
"use client";

import * as React from "react";
import type { GeneratedPalette } from "@/lib/ai";
import { deriveThemeVars, buildStyleContent } from "@/lib/palette-theme";

const STORAGE_KEY = "palette-theme";
const STYLE_ID = "palette-theme-style";

interface StoredPalette {
  colors: GeneratedPalette["colors"];
  mood: string;
}

interface PaletteThemeContextValue {
  isPaletteActive: boolean;
  currentMood: string;
  applyPalette: (palette: GeneratedPalette, mood: string) => void;
  updatePaletteColors: (colors: GeneratedPalette["colors"]) => void;
  resetPalette: () => void;
}

const PaletteThemeContext = React.createContext<PaletteThemeContextValue | null>(null);

export function PaletteThemeProvider({ children }: { children: React.ReactNode }) {
  const [isPaletteActive, setIsPaletteActive] = React.useState(false);
  const [currentMood, setCurrentMood] = React.useState("Professional");
  const currentMoodRef = React.useRef("Professional");

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      // Handle both old format (plain array) and new format ({ colors, mood })
      const colors: GeneratedPalette["colors"] = Array.isArray(parsed) ? parsed : parsed.colors;
      const mood: string = Array.isArray(parsed) ? "Professional" : (parsed.mood ?? "Professional");
      inject(colors, mood);
      setCurrentMood(mood);
      currentMoodRef.current = mood;
      setIsPaletteActive(true);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function inject(colors: GeneratedPalette["colors"], mood: string) {
    const { light, dark } = deriveThemeVars(colors);
    const css = buildStyleContent(light, dark, mood);
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
    document.documentElement.dataset.paletteActive = "";
  }

  function applyPalette(palette: GeneratedPalette, mood: string) {
    inject(palette.colors, mood);
    setCurrentMood(mood);
    currentMoodRef.current = mood;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ colors: palette.colors, mood }));
    setIsPaletteActive(true);
  }

  function updatePaletteColors(colors: GeneratedPalette["colors"]) {
    inject(colors, currentMoodRef.current);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredPalette;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, colors }));
      } catch {
        // DOM already updated; ignore storage failure
      }
    }
  }

  function resetPalette() {
    document.getElementById(STYLE_ID)?.remove();
    delete document.documentElement.dataset.paletteActive;
    localStorage.removeItem(STORAGE_KEY);
    setCurrentMood("Professional");
    currentMoodRef.current = "Professional";
    setIsPaletteActive(false);
  }

  return (
    <PaletteThemeContext.Provider value={{ isPaletteActive, currentMood, applyPalette, updatePaletteColors, resetPalette }}>
      {children}
    </PaletteThemeContext.Provider>
  );
}

export function usePaletteTheme() {
  const ctx = React.useContext(PaletteThemeContext);
  if (!ctx) throw new Error("usePaletteTheme must be used within PaletteThemeProvider");
  return ctx;
}
```

**Step 2: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

Expected: No errors. Note: `app/page.tsx` will error because it still calls `applyPalette(palette)` with one arg — that's fixed in Task 6.

**Step 3: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/components/palette-theme-provider.tsx
git commit -m "feat(palettai): add mood + updatePaletteColors to PaletteThemeProvider"
```

---

### Task 4: Add `onDragEnd` callback to `components/color-card.tsx`

**Files:**
- Modify: `apps/palettai/components/color-card.tsx`

**Step 1: Add `onDragEnd` to the props interface (line 14, after `onChange`)**

```typescript
interface ColorCardProps {
  hex: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "neutral" | "background";
  className?: string;
  size?: "sm" | "md" | "lg";
  onChange?: (hex: string) => void;
  onDragEnd?: () => void;
}
```

**Step 2: Destructure `onDragEnd` in the function signature (line 33)**

```typescript
export function ColorCard({ hex, name, role, className, size = "md", onChange, onDragEnd }: ColorCardProps) {
```

**Step 3: Update `handlePointerUp` (lines 82–85) to call `onDragEnd` when a drag occurred**

Replace:
```typescript
function handlePointerUp() {
  dragRef.current = null;
  setIsDragging(false);
}
```

With:
```typescript
function handlePointerUp() {
  const wasDrag = wasDragRef.current;
  dragRef.current = null;
  setIsDragging(false);
  if (wasDrag) {
    onDragEnd?.();
  }
}
```

**Step 4: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

**Step 5: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/components/color-card.tsx
git commit -m "feat(palettai): add onDragEnd callback to ColorCard"
```

---

### Task 5: Wire `PaletteDisplay` to `updatePaletteColors`

**Files:**
- Modify: `apps/palettai/components/palette-display.tsx`

**Step 1: Add import after existing imports (after line 10)**

```typescript
import { usePaletteTheme } from "./palette-theme-provider";
```

**Step 2: Add `colorsRef` to track latest colors, update `handleColorChange` and `useEffect`**

Inside the `PaletteDisplay` function, after line 31 (`const [colors, setColors] = ...`):

```typescript
const colorsRef = React.useRef(palette.colors);
```

Replace the `useEffect` at lines 34–36:
```typescript
React.useEffect(() => {
  setColors(palette.colors);
  colorsRef.current = palette.colors;
}, [palette]);
```

Replace `handleColorChange` at lines 38–42:
```typescript
function handleColorChange(index: number, newHex: string) {
  setColors((prev) => {
    const next = prev.map((c, i) => (i === index ? { ...c, hex: newHex } : c));
    colorsRef.current = next;
    return next;
  });
}
```

**Step 3: Add hook call and `handleDragEnd` after the existing hooks at the top of the component body**

After the `canSave` line (line 50), add:

```typescript
const { updatePaletteColors, isPaletteActive } = usePaletteTheme();

function handleDragEnd() {
  if (isPaletteActive) {
    updatePaletteColors(colorsRef.current);
  }
}
```

**Step 4: Pass `onDragEnd` to each `ColorCard` (lines 118–127)**

Replace the `ColorCard` usage:
```tsx
{colors.map((color, i) => (
  <ColorCard
    key={color.role}
    hex={color.hex}
    name={color.name}
    role={color.role}
    size="lg"
    onChange={(newHex) => handleColorChange(i, newHex)}
    onDragEnd={handleDragEnd}
  />
))}
```

**Step 5: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

**Step 6: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/components/palette-display.tsx
git commit -m "feat(palettai): update PaletteDisplay to apply theme on color drag end"
```

---

### Task 6: Update `PromptInput` callback + `app/page.tsx` handler

**Files:**
- Modify: `apps/palettai/components/prompt-input.tsx`
- Modify: `apps/palettai/app/page.tsx`

**Step 1: Update `PromptInput` — add `mood` to `onGenerated` (prompt-input.tsx)**

Change the interface at line 10:
```typescript
onGenerated: (palette: GeneratedPalette, remaining: number, mood: string) => void;
```

Change the call at line 71:
```typescript
onGenerated(data.palette, data.remaining ?? 0, mood);
```

**Step 2: Update `page.tsx` — handle mood param in `handleGenerated`**

Add `usePaletteTheme` import. The existing import at line 11:
```typescript
import { usePaletteTheme } from "@/components/palette-theme-provider";
```
(already present — just add `applyPalette` was already destructured; now also update its signature)

Update `handleGenerated` (lines 98–107) to accept and pass `mood`:

```typescript
function handleGenerated(newPalette: GeneratedPalette, newRemaining: number, mood: string) {
  setPalette(newPalette);
  setRemaining(newRemaining);
  setError(null);
  setSaveMessage(null);
  applyPalette(newPalette, mood);
  setTimeout(() => {
    paletteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}
```

**Step 3: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/components/prompt-input.tsx apps/palettai/app/page.tsx
git commit -m "feat(palettai): pass mood through onGenerated to applyPalette"
```

---

### Task 7: Replace hardcoded amber in `app/page.tsx` + add mood layout styles

**Files:**
- Modify: `apps/palettai/app/page.tsx`

Read the file first, then make all changes below. They can be done with a series of Edit tool calls.

**7a: Hero background blob (line ~145)**

Old:
```tsx
<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-amber-500/15 to-orange-600/10 rounded-full blur-3xl" />
```
New:
```tsx
<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-primary/15 to-accent/10 rounded-full blur-3xl" />
```

**7b: Hero section padding + mood layout (line ~142)**

Old:
```tsx
<section className="relative overflow-hidden bg-background py-16 sm:py-28">
```
New:
```tsx
<section
  className="relative overflow-hidden bg-background"
  style={{ paddingTop: "var(--mood-hero-py, 7rem)", paddingBottom: "var(--mood-hero-py, 7rem)" }}
>
```

**7c: Badge (line ~151)**

Old:
```tsx
<div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-amber-500/20">
```
New:
```tsx
<div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-primary/20">
```

**7d: Hero content max-width (line ~150)**

Old:
```tsx
<div className="text-center max-w-3xl mx-auto mb-12">
```
New:
```tsx
<div className="text-center mx-auto mb-12" style={{ maxWidth: "var(--mood-hero-max, 48rem)" }}>
```

**7e: H1 heading — add mood typography (lines ~153–161)**

Old:
```tsx
<h1
  className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-5 leading-tight font-display"
>
```
New:
```tsx
<h1
  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-tight font-display"
  style={{ letterSpacing: "var(--mood-tracking, -0.025em)", fontWeight: "var(--mood-weight, 700)" }}
>
```

**7f: Heading gradient span (line ~157)**

Old:
```tsx
<span className="bg-gradient-to-r from-amber-500 to-orange-400 bg-clip-text text-transparent">
```
New:
```tsx
<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
```

**7g: "5 free generations/day" (line ~169)**

Old:
```tsx
<span className="text-amber-500 dark:text-amber-400">5 free generations/day</span>
```
New:
```tsx
<span className="text-primary">5 free generations/day</span>
```

**7h: Generator card padding + radius (line ~175 area)**

Old:
```tsx
<div className="bg-card rounded-2xl border border-border shadow-xl p-6 sm:p-8">
```
New:
```tsx
<div
  className="bg-card border border-border shadow-xl"
  style={{ borderRadius: "var(--mood-radius, 1rem)", padding: "var(--mood-card-p, 1.5rem)" }}
>
```

**7i: Feature highlights section padding (line ~241)**

Old:
```tsx
<section className="container py-16">
```
New:
```tsx
<section
  className="container"
  style={{ paddingTop: "var(--mood-section-py, 4rem)", paddingBottom: "var(--mood-section-py, 4rem)" }}
>
```

**7j: Feature card border-radius (line ~263 inside map)**

Old:
```tsx
className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 shadow-sm"
```
New:
```tsx
className="flex flex-col items-start gap-3 border border-border bg-card p-6 shadow-sm"
style={{ borderRadius: "var(--mood-radius, 0.75rem)" }}
```

**7k: Feature icons (3 occurrences, lines ~245, 251, 257)**

Old: `text-amber-600 dark:text-amber-400`
New: `text-primary`

**7l: Feature icon backgrounds (line ~267)**

Old:
```tsx
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 dark:bg-amber-900/30">
```
New:
```tsx
<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
```

**7m: CTA "Go Pro" button (lines ~351–353)**

Old:
```tsx
<a
  href="/pricing"
  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-200 hover:-translate-y-0.5 text-base"
>
```
New:
```tsx
<a
  href="/pricing"
  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 hover:-translate-y-0.5 text-base"
>
```

**Step 2: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

**Step 3: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/app/page.tsx
git commit -m "feat(palettai): replace amber with primary/accent vars + add mood layout styles"
```

---

### Task 8: Replace hardcoded amber logo in `components/navigation-wrapper.tsx`

**Files:**
- Modify: `apps/palettai/components/navigation-wrapper.tsx`

**Step 1: Replace logo gradient classes (line 28)**

Old:
```tsx
<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
```
New:
```tsx
<div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm">
```

**Step 2: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

**Step 3: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/components/navigation-wrapper.tsx
git commit -m "feat(palettai): nav logo uses primary/accent instead of hardcoded amber"
```

---

### Task 9: Add CSS color transitions to `app/globals.css`

**Files:**
- Modify: `apps/palettai/app/globals.css`

**Step 1: Add transition block after the closing `}` of `@keyframes slideUp` (after line 76)**

```css
/* Smooth color morph when palette theme is active */
html[data-palette-active] *,
html[data-palette-active] *::before,
html[data-palette-active] *::after {
  transition:
    background-color 0.4s ease,
    color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}
```

**Step 2: TypeScript check (catches CSS issues indirectly via Next.js build)**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

**Step 3: Visual verify**

Open http://localhost:3003. Run `pnpm --filter palettai dev` if not running.

| Check | Expected |
|---|---|
| Default page (no palette) | Warm brown design, no CSS vars active |
| Select "Playful" mood, generate palette | Page re-themes with palette colors + generous rounded corners, wide hero |
| Select "Tech" mood, generate | Sharp corners, compressed spacing, monospace feel |
| Select "Bold" mood, generate | Dramatic spacing, heavy weight heading |
| Select "Elegant" mood, generate | Narrow centered column, thin weight, airy |
| Toggle dark/light | Both modes use palette + mood tokens |
| Drag a color card, release | Theme updates to new hex on pointer-up |
| Click "Reset theme" in nav | Returns to default amber design |
| Nav logo | Uses generated primary → accent gradient |
| Feature icon background | Uses primary color tint |
| "Go Pro" button | Uses primary color |
| Refresh page | Palette + mood restored from localStorage |

**Step 4: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/app/globals.css
git commit -m "feat(palettai): add color transition animations for palette theme morphing"
```
