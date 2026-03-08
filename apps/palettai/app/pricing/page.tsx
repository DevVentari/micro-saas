"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Zap, FolderKanban, Download, ShieldCheck } from "lucide-react";
import { PricingCard } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPro, loading } = useSubscription("palettai", user?.id);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);

  async function handleUpgrade() {
    if (!user) {
      router.push("/login?next=/pricing");
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            Pricing built for solo builders and product teams
          </div>
          <h1 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">Choose the plan that fits your workflow</h1>
          <p className="text-pretty mt-3 text-lg text-muted-foreground">
            Start free and upgrade when palette generation becomes part of your daily product process.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 items-start gap-8 md:grid-cols-2">
          <PricingCard
            name="Free"
            price={0}
            description="Best for trying PalettAI and generating occasional palettes."
            features={[
              "5 AI palette generations per day",
              "Semantic role output",
              "CSS variables export",
              "Sample palettes gallery",
              "No signup required to start",
            ]}
            isCurrent={!!user && !isPro && !loading}
            onSelect={() => router.push("/")}
            ctaLabel="Start Free"
          />

          <PricingCard
            name="Pro"
            price={5}
            description="For shipping teams who need unlimited generation and reusable palette assets."
            features={[
              "Unlimited AI palette generations",
              "All export formats (CSS, Tailwind, Figma, SVG, JSON)",
              "Save palettes to dashboard",
              "Ad-free experience",
              "Priority support",
            ]}
            isPopular
            isCurrent={isPro}
            onSelect={handleUpgrade}
            ctaLabel={
              checkoutLoading
                ? "Redirecting..."
                : isPro
                ? "Current Plan"
                : user
                ? "Upgrade to Pro"
                : "Get Pro - $5/mo"
            }
            className="border-primary/30"
          />
        </div>

        <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-7">
          <h2 className="text-xl font-semibold text-foreground">What changes when you upgrade</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: <Zap className="size-4 text-primary" />,
                title: "Unlimited generation",
                description: "Keep iterating without daily limits when refining brand systems.",
              },
              {
                icon: <FolderKanban className="size-4 text-primary" />,
                title: "Saved palette library",
                description: "Store approved palettes and reuse them across products and clients.",
              },
              {
                icon: <Download className="size-4 text-primary" />,
                title: "Complete export stack",
                description: "Export directly into dev and design tools without manual mapping.",
              },
              {
                icon: <ShieldCheck className="size-4 text-primary" />,
                title: "Faster production flow",
                description: "Reduce color decision churn and ship with consistent brand roles.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-background p-4">
                <div className="mb-2 flex size-7 items-center justify-center rounded-md bg-primary/10">{item.icon}</div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Cancel any time. No contracts. Billed monthly via Stripe.
        </p>
      </div>
    </div>
  );
}
