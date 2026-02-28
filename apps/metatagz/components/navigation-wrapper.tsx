"use client";

import { useRouter } from "next/navigation";
import { Navigation } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { Tag } from "lucide-react";

export function NavigationWrapper() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPro } = useSubscription("metatagz", user?.id);

  const navItems = [
    { label: "Pricing", href: "/pricing" },
    { label: "Dashboard", href: "/dashboard" },
  ];

  const handleLogin = () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <Navigation
      appName="MetaTagz"
      logo={<Tag className="w-5 h-5 text-primary" />}
      navItems={navItems}
      isLoggedIn={!!user}
      isPro={isPro}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
}
