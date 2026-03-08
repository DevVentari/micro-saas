"use client";
import * as React from "react";
import { Lock, Zap } from "lucide-react";
import { Button } from "@repo/ui";

interface ProGateProps {
  isPro: boolean;
  children: React.ReactNode;
  featureName: string;
}

export function ProGate({ isPro, children, featureName }: ProGateProps) {
  if (isPro) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-60">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border border-border bg-background/95 shadow-xl p-6 text-center max-w-xs mx-4">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Lock className="size-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">{featureName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upgrade to Pro to unlock the full UI prep suite.</p>
          <Button asChild className="mt-4 w-full gap-2">
            <a href="/pricing"><Zap className="size-4" />Upgrade to Pro — $5/mo</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
