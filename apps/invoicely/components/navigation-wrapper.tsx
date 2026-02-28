"use client";

import { useRouter } from "next/navigation";
import { Navigation } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";

export function NavigationWrapper() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPro } = useSubscription("invoicely", user?.id);

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
      appName="Invoicely"
      navItems={navItems}
      isLoggedIn={!!user}
      isPro={isPro}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
}
