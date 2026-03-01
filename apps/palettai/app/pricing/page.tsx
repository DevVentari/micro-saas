"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Zap } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 via-background to-background py-16 sm:py-24">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
            Choose your plan
          </h1>
          <p className="text-muted-foreground text-lg">
            Free forever. Upgrade for unlimited generations and all export formats.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-start">
          <PricingCard
            name="Free"
            price={0}
            description="Perfect for trying out AI palette generation."
            features={[
              "5 AI palette generations per day",
              "CSS Variables export",
              "Click-to-copy hex codes",
              "Semantic colour roles (primary, secondary, accent...)",
              "Access to sample palettes",
            ]}
            isCurrent={!!user && !isPro && !loading}
            onSelect={() => router.push("/")}
            ctaLabel="Start Generating"
          />

          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 opacity-40 blur-lg" />
            <PricingCard
              name="Pro"
              price={5}
              description="For designers and teams who need unlimited creativity."
              features={[
                "Unlimited AI palette generations",
                "No ads",
                "Save palette collections",
                "Team sharing",
                "CSS Variables export",
                "Tailwind Config export",
                "Figma JSON export",
                "SVG Palette export",
                "JSON Array export",
                "Custom palette naming",
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
                  : "Get Pro — $5/mo"
              }
              className="relative bg-slate-950 border-violet-700/60"
            />
          </div>
        </div>

        {/* FAQ / Features comparison */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            Why upgrade to Pro?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Zap className="w-4 h-4 text-violet-600" />,
                title: "Unlimited Generations",
                description:
                  "Never hit a daily cap. Generate as many palettes as you need, any time.",
              },
              {
                icon: <Sparkles className="w-4 h-4 text-violet-600" />,
                title: "Save Collections",
                description:
                  "Save your favorite palettes and organize them into collections in your dashboard.",
              },
              {
                icon: (
                  <svg
                    viewBox="0 0 16 16"
                    className="w-4 h-4 text-violet-600"
                    fill="currentColor"
                  >
                    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z" />
                  </svg>
                ),
                title: "All Export Formats",
                description:
                  "Export to CSS, Tailwind, Figma, SVG, and JSON. One click to copy, ready to paste.",
              },
              {
                icon: (
                  <svg
                    viewBox="0 0 16 16"
                    className="w-4 h-4 text-violet-600"
                    fill="currentColor"
                  >
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    <path
                      fillRule="evenodd"
                      d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"
                    />
                    <path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                  </svg>
                ),
                title: "Ad-Free Experience",
                description:
                  "Clean, distraction-free interface. Focus on your creative work.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card"
              >
                <div className="mt-0.5 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12">
          Cancel any time. No contracts. Billed monthly via Stripe.{" "}
          <span className="font-medium text-foreground">No questions asked.</span>
        </p>
      </div>
    </div>
  );
}
