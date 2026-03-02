"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { Palette, Sun, Moon, RotateCcw } from "lucide-react";
import { useTheme } from "./theme-provider";
import { usePaletteTheme } from "./palette-theme-provider";

export function NavigationWrapper() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPro } = useSubscription("palettai", user?.id);
  const { theme, toggle } = useTheme();
  const { isPaletteActive, resetPalette } = usePaletteTheme();

  const navItems = [
    { label: "Generator", href: "/" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <Navigation
      appName="PalettAI"
      logo={
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm">
          <Palette className="w-4 h-4 text-white" />
        </div>
      }
      navItems={navItems}
      isLoggedIn={!!user}
      isPro={isPro}
      onLogin={() => router.push("/login")}
      onLogout={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
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
    />
  );
}
