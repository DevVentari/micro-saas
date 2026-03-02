import type { GeneratedPalette } from "@/lib/ai";
import { hexToHsl, hslToHex, getContrastColor } from "@/lib/color-utils";

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
  return `${h % 360} ${Math.round(s)}% ${Math.round(l)}%`;
}

function fgFor(h: number, s: number, l: number): string {
  const hex = hslToHex(h, s, l);
  return getContrastColor(hex) === "black" ? hsl(h, s * 0.3, 5) : hsl(h, s * 0.3, 95);
}

export function deriveThemeVars(
  colors: GeneratedPalette["colors"]
): { light: ThemeVars; dark: ThemeVars } {
  const REQUIRED_ROLES: ColorRole[] = ["primary", "secondary", "accent", "neutral", "background"];
  const presentRoles = colors.map((c) => c.role);
  for (const role of REQUIRED_ROLES) {
    if (!presentRoles.includes(role)) {
      throw new Error(`Palette missing required role: ${role}`);
    }
  }

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
