"use client";

import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { AdBanner } from "@repo/ui";

export function InvoicelyAdBanner() {
  const { user } = useAuth();
  const { isPro } = useSubscription("invoicely", user?.id);
  if (isPro) return null;
  return <AdBanner slot="invoicely-home-bottom" format="leaderboard" />;
}
