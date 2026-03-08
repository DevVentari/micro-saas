# PalettAI Studio — Design Document

**Date:** 2026-03-08
**Status:** Approved

---

## Goal

Evolve palettai.com from a single palette generator into a full UI prep suite — colour palette, moodboard, style card, and component preview — serving casual users, designers, and developers from one prompt.

## Target Users

- **Casual** — wants vibes/inspiration, no technical knowledge required
- **Designer** — wants visual moodboard, typography pairings, exportable style card
- **Developer** — wants full shade scales, CSS tokens, Tailwind config, Figma JSON

## Architecture

Keep the homepage as the palette generator entry point. After generating, a new "Open in Studio" button routes to a dedicated `/studio?id=<palette_id>` page. Studio is the Pro upsell — free users see palette shades only; Pro unlocks moodboard, style card, and component preview.

```
palettai.com/           — palette generator (unchanged)
palettai.com/studio     — full UI prep suite (/studio?id=<palette_id>)
```

### New API Routes

| Route | Purpose | External APIs |
|-------|---------|--------------|
| `POST /api/studio/moodboard` | Unsplash search + DALL-E image | Unsplash, OpenAI Images |
| `POST /api/studio/stylecard` | Font pairing + tone words + usage rules | OpenAI, Google Fonts |

Shades and component preview are computed client-side — no new API routes.

## Studio Page Sections

Four sections rendered as sticky-nav tabs. Each loads independently with its own skeleton.

### 1. Palette Shades (free)

- Expands each of the 5 palette colours to a 9-step scale (50–900) using the existing `generateShades` util
- Displayed as Tailwind-style swatch rows per role (primary, secondary, accent, neutral, background)
- Click-to-copy: hex, HSL, RGB per swatch
- Export: full token JSON, CSS custom properties for all shades

### 2. Moodboard (Pro)

**API input:** `{ paletteName, mood, primaryHex }`

**Parallel calls:**
- Unsplash: `search("{mood} {paletteName} aesthetic")` → 7 curated photos (CDN URLs, no storage)
- DALL-E: `"abstract {mood} color field, {primaryHex} dominant, editorial photography"` → 1 AI hero image

**Layout:** Pinterest-style masonry grid, 2–3 columns, images display-only.

### 3. Style Card (Pro)

**API input:** `{ palette, mood }`

**OpenAI call returns:**
```ts
{
  headingFont: string,   // e.g. "Fraunces"
  bodyFont: string,      // e.g. "Inter"
  toneWords: string[5],  // e.g. ["bold", "warm", "approachable", "modern", "clean"]
  usageRules: string[3], // e.g. ["Use primary for CTAs only", ...]
}
```

**Google Fonts:** Fetch CSS for both fonts, inject into `<style>` tag for live preview.

**Export:** `html-to-image` renders the card component as a downloadable PNG.

### 4. Component Preview (Pro)

Rendered entirely client-side — palette colours injected as CSS custom properties. Static component set:
- Primary button + Ghost button
- Badge
- Input field
- Alert (success variant + error variant)
- Card (heading + body text + action)

No additional API calls.

## Data Flow

```
User generates palette on /
  → PaletteDisplay shows "Open in Studio" button
  → Click saves palette to Supabase (if not saved)
  → Navigate to /studio?id=<palette_id>

/studio/page.tsx (server component)
  → fetch palette from Supabase by ID
  → render 4 client section components in parallel
  → each section fetches its own API route on mount
```

## Free vs Pro Gating

| Feature | Free | Pro |
|---------|------|-----|
| Palette shades | ✓ | ✓ |
| Moodboard | Blurred + CTA | ✓ |
| Style card | Blurred + CTA | ✓ |
| Component preview | Blurred + CTA | ✓ |
| Studio URL sharing | ✓ (shades only) | ✓ (full) |

Locked sections show a blurred overlay with "Unlock with Pro" — visible but not accessible. Gives casual users a preview of value.

## Studio Page Layout

```
┌─────────────────────────────────────────────────┐
│  ← Back        [Palette Name]          Export ▼  │
├─────────────────────────────────────────────────┤
│  [Shades]  [Moodboard]  [Style Card]  [Preview]  │  ← sticky tab nav
├─────────────────────────────────────────────────┤
│                                                  │
│  Active section content                          │
│  (skeleton while loading)                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Export menu (top right):**
- Download style card PNG
- Download shade tokens JSON
- Copy CSS variables (all shades)
- Download extended Figma JSON

## Homepage Change

`PaletteDisplay` component gets one new button: "Open in Studio" (with Pro lock badge for free users). No other homepage changes.

## New Dependencies

| Package | Purpose |
|---------|---------|
| `unsplash-js` | Unsplash API client |
| `html-to-image` | Style card PNG export |

Google Fonts: loaded via CSS `@import` — no npm package needed.
DALL-E: existing OpenAI key, `images.generate` endpoint.
Unsplash: requires `UNSPLASH_ACCESS_KEY` env var.

## Supabase Schema Change

No schema changes needed — palette is already saved with `name`, `colors`, `description`. Studio reads the existing `palettes` table.

## Success Criteria

- Casual user: generates palette → opens studio → sees moodboard → shares URL
- Designer: downloads style card PNG with live fonts + palette
- Developer: copies full CSS variables for all shade scales
- Pro conversion: free user hits moodboard blur → upgrades
