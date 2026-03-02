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
