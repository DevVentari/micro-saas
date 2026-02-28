"use client";

import * as React from "react";
import type { Subscription, AppName } from "@repo/types";

interface UseSubscriptionResult {
  subscription: Subscription | null;
  isPro: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(
  app: AppName,
  userId: string | undefined
): UseSubscriptionResult {
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchSubscription = React.useCallback(async () => {
    if (!userId) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/subscription?app=${app}`);
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [app, userId]);

  React.useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    isPro: subscription?.plan === "pro" && subscription?.status === "active",
    loading,
    refresh: fetchSubscription,
  };
}
