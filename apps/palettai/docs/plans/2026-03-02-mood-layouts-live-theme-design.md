# Mood Layouts + Live Theme Update Design

**Date:** 2026-03-02
**Status:** Approved

## Goals

1. Each of the 8 moods has a distinct layout personality (spacing, radius, typography, structure)
2. Layout morphs smoothly when a palette is applied (CSS transitions)
3. Dragging a color card updates the theme on pointer-up
4. All hardcoded amber/orange values replaced with CSS variable references (primary/accent)
5. Nav logo icon uses palette primary color

## Architecture

### Files Changed

| File | Change |
|---|---|
| `lib/mood-layout.ts` | New — 8 mood token definitions |
| `lib/palette-theme.ts` | Extended — injects mood tokens + structural data-mood CSS alongside color vars |
| `components/palette-theme-provider.tsx` | Extended — stores/restores mood, adds `updatePaletteColors()`, `applyPalette()` gains `mood` param |
| `components/color-card.tsx` | New `onDragEnd?()` callback, fired on pointer-up |
| `components/palette-display.tsx` | Wires `onDragEnd`, calls `updatePaletteColors(colors)` |
| `components/prompt-input.tsx` | `onGenerated(palette, remaining, mood)` — mood added to callback signature |
| `app/page.tsx` | Passes mood to `applyPalette`; replaces all hardcoded amber with CSS vars |
| `components/navigation-wrapper.tsx` | Logo gradient replaced with `from-primary to-accent` |
| `app/globals.css` | CSS transition block for color + layout properties |

## Section 2: Mood Personalities

Each mood sets CSS custom properties injected into `html[data-palette-active]`.

| Mood | `--mood-radius` | `--mood-hero-py` | `--mood-section-py` | `--mood-card-p` | `--mood-font-scale` | `--mood-tracking` | `--mood-weight` | `--mood-hero-max` |
|---|---|---|---|---|---|---|---|---|
| Professional | 0.375rem | 5rem | 3rem | 1.5rem | 1.0 | -0.025em | 600 | 48rem |
| Playful | 1.5rem | 8rem | 5rem | 2rem | 1.15 | 0em | 700 | 56rem |
| Elegant | 0.75rem | 10rem | 5rem | 2rem | 0.95 | 0.05em | 300 | 40rem |
| Nature | 1rem | 7rem | 4rem | 1.75rem | 1.0 | 0em | 400 | 48rem |
| Tech | 0.125rem | 4rem | 3rem | 1.25rem | 0.9 | 0.04em | 500 | 52rem |
| Warm | 1.25rem | 6rem | 4rem | 1.75rem | 1.0 | 0em | 500 | 48rem |
| Cool | 0.25rem | 8rem | 4rem | 1.75rem | 0.9 | 0.08em | 300 | 44rem |
| Bold | 0.25rem | 9rem | 5rem | 2rem | 1.25 | -0.04em | 900 | 64rem |

### How they apply

The existing `buildStyleContent` in `lib/palette-theme.ts` is extended to also emit mood layout CSS. The full injected `<style>` block becomes:

```css
html[data-palette-active] {
  /* color vars */
  --background: ...;
  /* mood layout vars */
  --mood-radius: ...;
  --mood-hero-py: ...;
  /* etc. */
}
html[data-palette-active].dark {
  /* dark color vars */
}
```

Page elements reference these via Tailwind's `rounded-[var(--mood-radius)]` arbitrary syntax and inline `style` props for padding/spacing. Transitions on the underlying CSS properties animate the morph.

### Default mood (no palette active)

When no palette is active, all `--mood-*` vars are unset and defaults apply (Professional feel — the existing design).

## Section 3: Data Flow Changes

### `onGenerated` callback signature

```typescript
// Before
onGenerated: (palette: GeneratedPalette, remaining: number) => void

// After
onGenerated: (palette: GeneratedPalette, remaining: number, mood: string) => void
```

`PromptInput` passes `mood` as the third argument. `page.tsx` receives it and passes to `applyPalette`.

### `applyPalette` signature

```typescript
// Before
applyPalette: (palette: GeneratedPalette) => void

// After
applyPalette: (palette: GeneratedPalette, mood: string) => void
```

Mood is stored in localStorage alongside colors: `{ colors, mood }` under key `"palette-theme"`.

### New `updatePaletteColors`

```typescript
updatePaletteColors: (colors: GeneratedPalette["colors"]) => void
```

Reruns `deriveThemeVars(colors)` and re-injects the `<style>` element, keeping the current mood layout tokens. Called from `PaletteDisplay` after pointer-up.

### ColorCard `onDragEnd`

```typescript
// New prop
onDragEnd?: () => void
```

Called in `handlePointerUp` after clearing drag state. `PaletteDisplay` provides this and calls `updatePaletteColors(colors)` when it fires.

## Section 4: Amber → CSS Variable Replacements

All replacements in `app/page.tsx` and `components/navigation-wrapper.tsx`:

| Old class | New class |
|---|---|
| `from-amber-500 to-orange-600` | `from-primary to-accent` |
| `text-amber-600 dark:text-amber-400` | `text-primary` |
| `bg-amber-500/10 dark:bg-amber-900/30` | `bg-primary/10` |
| `text-amber-500 dark:text-amber-400` | `text-primary` |
| `bg-amber-500 hover:bg-amber-400` | `bg-primary hover:bg-primary/90` |
| `shadow-amber-500/25 hover:shadow-amber-500/40` | `shadow-primary/25 hover:shadow-primary/40` |
| `from-amber-500/15 to-orange-600/10` | `from-primary/15 to-accent/10` |

## CSS Transitions

Added to `app/globals.css` — smooth morph when palette/mood applies:

```css
html[data-palette-active] *,
html[data-palette-active] *::before,
html[data-palette-active] *::after {
  transition:
    background-color 0.4s ease,
    color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    padding 0.5s ease,
    gap 0.5s ease,
    border-radius 0.5s ease;
}
```

## Constraints

- No new npm packages
- `--mood-*` tokens only active when `data-palette-active` is set — default design unchanged
- Mood persisted alongside colors in localStorage; restored on mount
- Drag update (pointer-up) only re-runs color derivation, not mood layout (mood is stable per session)
- Pricing page amber values left unchanged (out of scope — separate page, no palette context)
