"use client";

import * as React from "react";
import { Suspense } from "react";
import { PricingCard } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const FREE_FEATURES = [
  "5 URL checks per day",
  "Google search preview",
  "Twitter / X card preview",
  "Basic meta tag breakdown",
  "Character count validation",
];

const PRO_FEATURES = [
  "Unlimited URL checks",
  "Google search preview",
  "Twitter / X card preview",
  "Facebook Open Graph preview",
  "LinkedIn post preview",
  "Slack unfurl preview",
  "URL check history",
  "Bulk URL checking",
  "Monitoring alerts",
  "API access",
  "No ads",
];

function PricingContent() {
  const { user } = useAuth();
  const { subscription, isPro, loading } = useSubscription("metatagz", user?.id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/login?next=/pricing");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || "Failed to start checkout");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setCheckoutError("Network error. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleFree = () => {
    router.push("/");
  };

  return (
    <div className="container py-16 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Start free with Google and Twitter previews. Upgrade to Pro for all 5
          platform previews and unlimited checks.
        </p>
      </div>

      {/* Alerts */}
      {canceled && (
        <div className="mb-8 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">Checkout was canceled. You can try again whenever you&apos;re ready.</p>
        </div>
      )}

      {checkoutError && (
        <div className="mb-8 flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{checkoutError}</p>
        </div>
      )}

      {/* Pricing Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <PricingCard
            name="Free"
            price={0}
            description="Perfect for occasional meta tag checks."
            features={FREE_FEATURES}
            isCurrent={!isPro && !!user}
            onSelect={handleFree}
            ctaLabel={user ? (isPro ? undefined : "Current Plan") : "Get Started Free"}
          />
          <PricingCard
            name="Pro"
            price={8}
            description="For developers, marketers, and SEO professionals."
            features={PRO_FEATURES}
            isPopular
            isCurrent={isPro}
            onSelect={handleUpgrade}
            ctaLabel={
              checkoutLoading
                ? "Redirecting to checkout..."
                : isPro
                ? "Current Plan"
                : !user
                ? "Sign In to Upgrade"
                : "Upgrade to Pro"
            }
          />
        </div>
      )}

      {/* Comparison note */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>All plans include SSL-secure fetching and no data storage of fetched pages.</p>
        <p className="mt-1">
          Pro plan is billed monthly. Cancel anytime.{" "}
          {isPro && subscription?.current_period_end && (
            <span>
              Your plan renews on{" "}
              {new Date(subscription.current_period_end).toLocaleDateString()}.
            </span>
          )}
        </p>
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {[
            {
              q: "What does MetaTagz check?",
              a: "MetaTagz fetches the HTML of any URL and parses all meta tags including <title>, <meta name='description'>, Open Graph (og:*) tags, Twitter Card tags, and the canonical URL.",
            },
            {
              q: "Why can't I see Facebook/LinkedIn/Slack previews for free?",
              a: "These advanced platform previews are Pro features. The free tier includes Google and Twitter previews, which cover the most common use cases.",
            },
            {
              q: "Does MetaTagz store the pages I check?",
              a: "No. We fetch pages server-side to avoid CORS issues and parse the meta tags in memory. We do not store page content. Pro users get a history of the URLs they checked (not the content).",
            },
            {
              q: "How does the daily limit work for free users?",
              a: "Free users can check up to 5 URLs per day, tracked by IP address. The counter resets at midnight UTC. Signing up doesn't remove the limit — only a Pro subscription does.",
            },
            {
              q: "Can I use the API?",
              a: "Yes — API access is a Pro feature. Pro subscribers can POST to /api/fetch-meta with an authenticated session and get structured JSON results programmatically.",
            },
          ].map((faq) => (
            <div key={faq.q} className="border-b pb-6 last:border-0">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <PricingContent />
    </Suspense>
  );
}
