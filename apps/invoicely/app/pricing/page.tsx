"use client";

import { useRouter } from "next/navigation";
import { PricingCard } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { Check } from "lucide-react";

const FREE_FEATURES = [
  "Create unlimited invoices (session)",
  "PDF download with watermark",
  "All core invoice fields",
  "Line items with auto-calculation",
  "Tax & discount support",
  "Multi-currency display",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Watermark-free PDF downloads",
  "No ads",
  "Save unlimited invoices to cloud",
  "Client address book",
  "Custom logo upload",
  "Multi-currency (10+ currencies)",
  "Invoice status tracking",
  "Priority support",
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, isPro, loading } = useSubscription(
    "invoicely",
    user?.id
  );

  const handleFreeSelect = () => {
    router.push("/");
  };

  const handleProSelect = async () => {
    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: "invoicely" }),
      });

      if (!res.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  const isFreeCurrent =
    !loading && (!subscription || subscription.plan === "free");
  const isProCurrent = !loading && isPro;

  return (
    <div className="container py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Simple, Transparent Pricing
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Start for free, upgrade when you need more. No hidden fees.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto items-start">
        <PricingCard
          name="Free"
          price={0}
          description="Perfect for occasional invoicing. No signup required."
          features={FREE_FEATURES}
          isCurrent={isFreeCurrent && !isProCurrent}
          onSelect={handleFreeSelect}
          ctaLabel={
            isFreeCurrent && !isProCurrent ? "Current Plan" : "Get Started Free"
          }
        />
        <PricingCard
          name="Pro"
          price={5}
          description="For freelancers and businesses that invoice regularly."
          features={PRO_FEATURES}
          isPopular={true}
          isCurrent={isProCurrent}
          onSelect={handleProSelect}
          ctaLabel={
            isProCurrent
              ? "Current Plan"
              : !user
              ? "Sign in to Upgrade"
              : "Upgrade to Pro"
          }
        />
      </div>

      {/* FAQ Section */}
      <div className="max-w-2xl mx-auto mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div className="border rounded-lg p-5">
            <h3 className="font-semibold mb-2">
              Do I need to sign up to use Invoicely?
            </h3>
            <p className="text-sm text-muted-foreground">
              No! You can create and download invoices for free without any
              account. Sign up only if you want to save invoices to the cloud or
              upgrade to Pro.
            </p>
          </div>
          <div className="border rounded-lg p-5">
            <h3 className="font-semibold mb-2">
              What does the watermark look like?
            </h3>
            <p className="text-sm text-muted-foreground">
              Free invoices include a subtle "Created with Invoicely.app"
              watermark at the bottom and a light diagonal watermark. Upgrade to
              Pro to remove it entirely.
            </p>
          </div>
          <div className="border rounded-lg p-5">
            <h3 className="font-semibold mb-2">
              Can I cancel my Pro subscription anytime?
            </h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel at any time. You'll retain Pro access until
              the end of your billing period.
            </p>
          </div>
          <div className="border rounded-lg p-5">
            <h3 className="font-semibold mb-2">
              Is my invoice data secure?
            </h3>
            <p className="text-sm text-muted-foreground">
              All data is encrypted and stored securely. We use Supabase for
              database storage and Stripe for payments. We never store your
              clients' payment information.
            </p>
          </div>
        </div>
      </div>

      {/* Money-back guarantee */}
      <div className="text-center mt-12 p-6 bg-muted/30 rounded-xl max-w-md mx-auto">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Check className="h-5 w-5 text-green-500" />
          <span className="font-semibold">30-Day Money-Back Guarantee</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Not happy with Pro? Contact us within 30 days for a full refund. No
          questions asked.
        </p>
      </div>
    </div>
  );
}
