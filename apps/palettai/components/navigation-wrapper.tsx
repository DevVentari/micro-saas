"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { Palette } from "lucide-react";

export function NavigationWrapper() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPro } = useSubscription("palettai", user?.id);

  const navItems = [
    { label: "Generator", href: "/" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <Navigation
      appName="PalettAI"
      logo={
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
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
    />
  );
}
