# Palette Theme Wiring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the generated colour palette to the entire UI theme — backgrounds, buttons, text, borders — in both light and dark mode, with localStorage persistence and a reset button.

**Architecture:** A new `PaletteThemeProvider` context injects a `<style id="palette-theme-style">` element targeting `html[data-palette-active]` and `html[data-palette-active].dark`. The existing `ThemeProvider` continues toggling `.dark` on `<html>` unchanged — the palette styles sit on top via later-in-document specificity. Palette colours are serialised to `localStorage` and restored on mount.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS. No new packages. Uses existing `hexToHsl` from `lib/color-utils.ts` and `GeneratedPalette` type from `lib/ai.ts`.

---

### Task 1: Create `lib/palette-theme.ts` (derivation + style builder)

**Files:**
- Create: `apps/palettai/lib/palette-theme.ts`

**What it does:** Converts the 5 semantic palette colours into complete light + dark CSS variable sets, then builds the CSS string to inject.

**Step 1: Create the file**

```typescript
import type { GeneratedPalette } from "@/lib/ai";
import { hexToHsl } from "@/lib/color-utils";

type ColorRole = "primary" | "secondary" | "accent" | "neutral" | "background";

interface ThemeVars {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  border: string;
  input: string;
  ring: string;
}

function hsl(h: number, s: number, l: number): string {
  return `${h} ${Math.round(s)}% ${Math.round(l)}%`;
}

function fgFor(h: number, s: number, l: number): string {
  return l > 50 ? hsl(h, s * 0.3, 5) : hsl(h, s * 0.3, 95);
}

export function deriveThemeVars(
  colors: GeneratedPalette["colors"]
): { light: ThemeVars; dark: ThemeVars } {
  const byRole = Object.fromEntries(
    colors.map((c) => [c.role, hexToHsl(c.hex)])
  ) as Record<ColorRole, { h: number; s: number; l: number }>;

  const bg = byRole.background;
  const pri = byRole.primary;
  const sec = byRole.secondary;
  const acc = byRole.accent;
  const neu = byRole.neutral;

  const light: ThemeVars = {
    background: hsl(bg.h, Math.max(8, bg.s * 0.3), 97),
    foreground: hsl(bg.h, Math.max(15, bg.s * 0.5), 8),
    card: hsl(bg.h, bg.s * 0.2, 99),
    "card-foreground": hsl(bg.h, Math.max(15, bg.s * 0.5), 8),
    popover: hsl(bg.h, bg.s * 0.2, 99),
    "popover-foreground": hsl(bg.h, Math.max(15, bg.s * 0.5), 8),
    primary: hsl(pri.h, pri.s, pri.l),
    "primary-foreground": fgFor(pri.h, pri.s, pri.l),
    secondary: hsl(sec.h, Math.max(5, sec.s * 0.4), 92),
    "secondary-foreground": hsl(sec.h, sec.s * 0.5, 15),
    muted: hsl(sec.h, Math.max(5, sec.s * 0.4), 92),
    "muted-foreground": hsl(sec.h, sec.s * 0.4, 45),
    accent: hsl(acc.h, acc.s, acc.l),
    "accent-foreground": fgFor(acc.h, acc.s, acc.l),
    border: hsl(neu.h, Math.max(5, neu.s * 0.3), 88),
    input: hsl(neu.h, neu.s * 0.2, 90),
    ring: hsl(pri.h, pri.s, pri.l),
  };

  const dark: ThemeVars = {
    background: hsl(bg.h, Math.max(5, bg.s * 0.15), 5),
    foreground: hsl(bg.h, Math.max(30, bg.s * 0.4), 93),
    card: hsl(bg.h, bg.s * 0.1, 8),
    "card-foreground": hsl(bg.h, Math.max(30, bg.s * 0.4), 93),
    popover: hsl(bg.h, bg.s * 0.1, 8),
    "popover-foreground": hsl(bg.h, Math.max(30, bg.s * 0.4), 93),
    primary: hsl(pri.h, pri.s, pri.l),
    "primary-foreground": fgFor(pri.h, pri.s, pri.l),
    secondary: hsl(sec.h, Math.max(4, sec.s * 0.2), 12),
    "secondary-foreground": hsl(sec.h, sec.s * 0.4, 93),
    muted: hsl(sec.h, Math.max(4, sec.s * 0.2), 12),
    "muted-foreground": hsl(sec.h, Math.max(16, sec.s * 0.3), 64),
    accent: hsl(acc.h, acc.s, acc.l),
    "accent-foreground": fgFor(acc.h, acc.s, acc.l),
    border: hsl(neu.h, Math.max(4, neu.s * 0.2), 16),
    input: hsl(neu.h, neu.s * 0.15, 12),
    ring: hsl(pri.h, pri.s, pri.l),
  };

  return { light, dark };
}

export function buildStyleContent(light: ThemeVars, dark: ThemeVars): string {
  const toRule = (vars: ThemeVars) =>
    Object.entries(vars)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join("\n");

  return `html[data-palette-active] {\n${toRule(light)}\n}\nhtml[data-palette-active].dark {\n${toRule(dark)}\n}`;
}
```

**Step 2: Verify TypeScript compiles**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/lib/palette-theme.ts
git commit -m "feat(palettai): add palette-theme derivation and style builder"
```

---

### Task 2: Create `components/palette-theme-provider.tsx`

**Files:**
- Create: `apps/palettai/components/palette-theme-provider.tsx`

**What it does:** React context that holds `isPaletteActive`, `applyPalette(palette)`, and `resetPalette()`. Restores from localStorage on mount.

**Step 1: Create the file**

```typescript
"use client";

import * as React from "react";
import type { GeneratedPalette } from "@/lib/ai";
import { deriveThemeVars, buildStyleContent } from "@/lib/palette-theme";

const STORAGE_KEY = "palette-theme";
const STYLE_ID = "palette-theme-style";

interface PaletteThemeContextValue {
  isPaletteActive: boolean;
  applyPalette: (palette: GeneratedPalette) => void;
  resetPalette: () => void;
}

const PaletteThemeContext = React.createContext<PaletteThemeContextValue | null>(null);

export function PaletteThemeProvider({ children }: { children: React.ReactNode }) {
  const [isPaletteActive, setIsPaletteActive] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const colors = JSON.parse(stored) as GeneratedPalette["colors"];
      inject(colors);
      setIsPaletteActive(true);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function inject(colors: GeneratedPalette["colors"]) {
    const { light, dark } = deriveThemeVars(colors);
    const css = buildStyleContent(light, dark);
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = css;
    document.documentElement.dataset.paletteActive = "";
  }

  function applyPalette(palette: GeneratedPalette) {
    inject(palette.colors);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palette.colors));
    setIsPaletteActive(true);
  }

  function resetPalette() {
    document.getElementById(STYLE_ID)?.remove();
    delete document.documentElement.dataset.paletteActive;
    localStorage.removeItem(STORAGE_KEY);
    setIsPaletteActive(false);
  }

  return (
    <PaletteThemeContext.Provider value={{ isPaletteActive, applyPalette, resetPalette }}>
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

Expected: No errors.

**Step 3: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/components/palette-theme-provider.tsx
git commit -m "feat(palettai): add PaletteThemeProvider context"
```

---

### Task 3: Wire provider into `app/layout.tsx`

**Files:**
- Modify: `apps/palettai/app/layout.tsx`

**Step 1: Add the import**

At the top of the file, after the existing `ThemeProvider` import on line 8:

```typescript
import { PaletteThemeProvider } from "@/components/palette-theme-provider";
```

**Step 2: Wrap `AuthProvider` with `PaletteThemeProvider`**

Change:
```tsx
<ThemeProvider>
  <AuthProvider>
    <div className="min-h-screen flex flex-col">
      <NavigationWrapper />
      <main className="flex-1">{children}</main>
      <Footer appName="PalettAI" />
    </div>
  </AuthProvider>
</ThemeProvider>
```

To:
```tsx
<ThemeProvider>
  <PaletteThemeProvider>
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <NavigationWrapper />
        <main className="flex-1">{children}</main>
        <Footer appName="PalettAI" />
      </div>
    </AuthProvider>
  </PaletteThemeProvider>
</ThemeProvider>
```

**Step 3: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

**Step 4: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/app/layout.tsx
git commit -m "feat(palettai): mount PaletteThemeProvider in root layout"
```

---

### Task 4: Call `applyPalette` in `app/page.tsx`

**Files:**
- Modify: `apps/palettai/app/page.tsx`

**Step 1: Add import at top of file** (after existing imports, around line 11)

```typescript
import { usePaletteTheme } from "@/components/palette-theme-provider";
```

**Step 2: Add hook call** inside `HomePage` function, after the existing hooks (around line 91)

```typescript
const { applyPalette } = usePaletteTheme();
```

**Step 3: Call `applyPalette` in `handleGenerated`**

Change `handleGenerated` (lines 98–107) from:
```typescript
function handleGenerated(newPalette: GeneratedPalette, newRemaining: number) {
  setPalette(newPalette);
  setRemaining(newRemaining);
  setError(null);
  setSaveMessage(null);
  setTimeout(() => {
    paletteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}
```

To:
```typescript
function handleGenerated(newPalette: GeneratedPalette, newRemaining: number) {
  setPalette(newPalette);
  setRemaining(newRemaining);
  setError(null);
  setSaveMessage(null);
  applyPalette(newPalette);
  setTimeout(() => {
    paletteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}
```

**Step 4: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

**Step 5: Visual verify**

Open http://localhost:3003. Generate a palette. The entire page — background, nav, cards, buttons, borders — should update to the new palette colours. Toggle dark/light — both should use the palette.

**Step 6: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/app/page.tsx
git commit -m "feat(palettai): apply palette theme on generation"
```

---

### Task 5: Add reset button to `components/navigation-wrapper.tsx`

**Files:**
- Modify: `apps/palettai/components/navigation-wrapper.tsx`

**Step 1: Add imports**

Add to the existing imports (after line 9):
```typescript
import { usePaletteTheme } from "./palette-theme-provider";
import { RotateCcw } from "lucide-react";
```

**Step 2: Add hook call** inside `NavigationWrapper` function, after the existing hooks (around line 15):

```typescript
const { isPaletteActive, resetPalette } = usePaletteTheme();
```

**Step 3: Replace the `rightExtra` prop**

Change:
```tsx
rightExtra={
  <button
    onClick={toggle}
    aria-label="Toggle theme"
    className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
  >
    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
  </button>
}
```

To:
```tsx
rightExtra={
  <div className="flex items-center gap-1">
    {isPaletteActive && (
      <button
        onClick={resetPalette}
        aria-label="Reset theme"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset theme
      </button>
    )}
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  </div>
}
```

**Step 4: TypeScript check**

```bash
cd /e/Projects/Websites
pnpm --filter palettai exec tsc --noEmit
```

**Step 5: Visual verify**

- After generating a palette, confirm "Reset theme" button appears in the nav
- Click it — the page should snap back to the default warm-brown design tokens
- The button should disappear after reset
- Refresh the page — palette theme should still be active (before reset)
- Refresh after reset — default theme

**Step 6: Commit**

```bash
cd /e/Projects/Websites
git add apps/palettai/components/navigation-wrapper.tsx
git commit -m "feat(palettai): add reset theme button to navigation"
```

---

### Task 6: Final end-to-end verification

**Step 1: Check the dev server is running**

```bash
cd /e/Projects/Websites
pnpm --filter palettai dev
```

Open http://localhost:3003.

**Step 2: Verify each scenario**

| Scenario | Expected |
|---|---|
| Generate "Ocean Depths" prompt | Page turns blue — background, nav, cards, borders all shift |
| Toggle dark mode | Dark variant of ocean palette applies |
| Toggle back to light | Light variant |
| Refresh page | Ocean palette persists |
| Click "Reset theme" | Returns to warm brown defaults, button disappears |
| Refresh after reset | Default theme, no button |
| Generate again after reset | New palette applies |

**Step 3: Check devtools**

In Elements panel, inspect `<html>` — it should have `data-palette-active=""` when active and a `<style id="palette-theme-style">` in `<head>` with the correct CSS vars.

**Step 4: Commit summary if anything was fixed**

```bash
cd /e/Projects/Websites
git log --oneline -6
```
