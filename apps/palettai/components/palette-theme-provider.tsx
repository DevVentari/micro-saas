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
