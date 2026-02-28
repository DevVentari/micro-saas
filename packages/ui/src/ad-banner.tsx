"use client";

import * as React from "react";
import { cn } from "./utils";

interface AdBannerProps {
  slot: string;
  format?: "auto" | "rectangle" | "banner" | "leaderboard";
  className?: string;
  clientId?: string;
}

export function AdBanner({
  slot,
  format = "auto",
  className,
  clientId,
}: AdBannerProps) {
  const adClient = clientId || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  React.useEffect(() => {
    if (typeof window !== "undefined" && adClient) {
      try {
        // @ts-expect-error adsbygoogle is injected by Google
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (_e) {
        // Ad blocker or not loaded
      }
    }
  }, [adClient]);

  if (!adClient) {
    // Placeholder in development
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/50 border border-dashed border-muted-foreground/30 rounded text-xs text-muted-foreground",
          format === "banner" && "h-24 w-full",
          format === "rectangle" && "h-64 w-80",
          format === "leaderboard" && "h-24 w-full max-w-2xl",
          format === "auto" && "h-24 w-full",
          className
        )}
      >
        Ad Placeholder
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", className)}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
