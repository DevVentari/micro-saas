# PalettAI — Dynamic Palette Theme Wiring

**Date:** 2026-03-02
**Status:** Approved

## Goal

When a palette is generated, the entire UI re-themes to use those colors — backgrounds, buttons, borders, text — in both light and dark mode. The theme persists across refreshes and navigation. A reset button returns to the default warm-brown design tokens.

## Architecture

Four files changed:

| File | Change |
|---|---|
| `lib/palette-theme.ts` | New — `deriveThemeVars(palette)` |
| `components/palette-theme-provider.tsx` | New — Context with `applyPalette()` / `resetPalette()` |
| `app/layout.tsx` | Wrap with `PaletteThemeProvider` (inside existing `ThemeProvider`) |
| `app/page.tsx` | Call `applyPalette(palette)` after successful generation |

The provider injects a `<style id="palette-theme">` element targeting:

```css
html[data-palette-active] { /* light vars */ }
html[data-palette-active].dark { /* dark vars */ }
```

The existing `ThemeProvider` continues toggling `.dark` on `<html>` unchanged. Palette styles override via later-in-document specificity and `data-palette-active` attribute.

## Color Derivation

Each of the 5 palette roles is converted from hex to HSL, then mapped to CSS variables:

### Light Mode

| CSS Variable | Source Role | Formula |
|---|---|---|
| `--background` | `background` | h, clamp(s×0.3, 8, 25)%, 97% |
| `--foreground` | `background` | h, clamp(s×0.5, 15, 30)%, 8% |
| `--card` | `background` | h, s×0.2%, 99% |
| `--card-foreground` | `background` | same as foreground |
| `--popover` | `background` | h, s×0.2%, 99% |
| `--popover-foreground` | `background` | same as foreground |
| `--primary` | `primary` | h, s%, l% (as-is) |
| `--primary-foreground` | `primary` | l>50 → (h, s×0.3%, 5%) else (h, s×0.3%, 95%) |
| `--secondary` | `secondary` | h, clamp(s×0.4, 5, 30)%, 92% |
| `--secondary-foreground` | `secondary` | h, s×0.5%, 15% |
| `--muted` | `secondary` | same as secondary |
| `--muted-foreground` | `secondary` | h, s×0.4%, 45% |
| `--accent` | `accent` | h, s%, l% (as-is) |
| `--accent-foreground` | `accent` | l>50 → (h, s×0.3%, 5%) else (h, s×0.3%, 95%) |
| `--border` | `neutral` | h, clamp(s×0.3, 5, 20)%, 88% |
| `--input` | `neutral` | h, s×0.2%, 90% |
| `--ring` | `primary` | h, s%, l% (as-is) |

### Dark Mode

Same hue sources, inverted lightness:

| CSS Variable | Source Role | Formula |
|---|---|---|
| `--background` | `background` | h, clamp(s×0.15, 5, 12)%, 5% |
| `--foreground` | `background` | h, clamp(s×0.4, 30, 55)%, 93% |
| `--card` | `background` | h, s×0.1%, 8% |
| `--card-foreground` | `background` | same as dark foreground |
| `--popover` | `background` | h, s×0.1%, 8% |
| `--popover-foreground` | `background` | same as dark foreground |
| `--primary` | `primary` | h, s%, l% (as-is) |
| `--primary-foreground` | `primary` | l>50 → (h, s×0.3%, 5%) else (h, s×0.3%, 95%) |
| `--secondary` | `secondary` | h, clamp(s×0.2, 4, 15)%, 12% |
| `--secondary-foreground` | `secondary` | h, s×0.4%, 93% |
| `--muted` | `secondary` | same as dark secondary |
| `--muted-foreground` | `secondary` | h, clamp(s×0.3, 16, 40)%, 64% |
| `--accent` | `accent` | h, s%, l% (as-is) |
| `--accent-foreground` | `accent` | l>50 → (h, s×0.3%, 5%) else (h, s×0.3%, 95%) |
| `--border` | `neutral` | h, clamp(s×0.2, 4, 14)%, 16% |
| `--input` | `neutral` | h, s×0.15%, 12% |
| `--ring` | `primary` | h, s%, l% (as-is) |

## Persistence

- On `applyPalette()`: serialize palette color array to `localStorage` key `palette-theme`; set `data-palette-active` on `<html>`; inject style tag
- On mount (provider): read `localStorage`, if present restore style tag and attribute
- On `resetPalette()`: remove style tag, remove attribute, clear `localStorage`

## Reset Button

Placed in `NavigationWrapper` — shown only when `data-palette-active` is set (i.e. `isPaletteActive` from context is true). Small text button: "Reset theme". Calls `resetPalette()`.

## Constraints

- No changes to `ThemeProvider` or `globals.css`
- No new npm packages — uses existing `hexToHsl` from `lib/color-utils.ts`
- `<style>` tag is inserted/replaced by ID (`palette-theme`) — no duplicates on re-generate
- Derivation is pure functions — easily testable in isolation
