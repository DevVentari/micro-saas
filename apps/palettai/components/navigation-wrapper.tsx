"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { Palette, Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

export function NavigationWrapper() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPro } = useSubscription("palettai", user?.id);
  const { theme, toggle } = useTheme();

  const navItems = [
    { label: "Generator", href: "/" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <Navigation
      appName="PalettAI"
      logo={
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
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
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      }
    />
  );
}
