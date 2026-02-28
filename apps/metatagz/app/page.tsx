"use client";

import * as React from "react";
import { UrlInput } from "@/components/url-input";
import { GooglePreview } from "@/components/google-preview";
import { TwitterPreview } from "@/components/twitter-preview";
import { FacebookPreview } from "@/components/facebook-preview";
import { LinkedInPreview } from "@/components/linkedin-preview";
import { SlackPreview } from "@/components/slack-preview";
import { AdBanner } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import type { MetaResult } from "@/lib/og-parser";
import {
  Search,
  Twitter,
  Globe,
  Share2,
  MessageSquare,
  Linkedin,
  ShieldCheck,
  Zap,
  BarChart2,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Search className="w-6 h-6 text-primary" />,
    title: "Google Search Preview",
    description:
      "See exactly how your page title, URL, and description appear in Google search results with real character count validation.",
  },
  {
    icon: <Twitter className="w-6 h-6 text-primary" />,
    title: "Twitter / X Cards",
    description:
      "Preview summary and summary_large_image card formats. Verify twitter:title, twitter:description, and twitter:image.",
  },
  {
    icon: <Globe className="w-6 h-6 text-primary" />,
    title: "Facebook Open Graph",
    description:
      "Check og:title, og:description, og:image, and og:type. See a pixel-perfect Facebook link preview.",
    pro: true,
  },
  {
    icon: <Linkedin className="w-6 h-6 text-primary" />,
    title: "LinkedIn Preview",
    description:
      "Verify how your content appears in LinkedIn posts with proper og:image and metadata.",
    pro: true,
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-primary" />,
    title: "Slack Unfurl",
    description:
      "Preview the Slack link unfurl with site name, title, description, and image thumbnail.",
    pro: true,
  },
  {
    icon: <Share2 className="w-6 h-6 text-primary" />,
    title: "All Open Graph Tags",
    description:
      "Full breakdown of every og: and twitter: meta tag found on the page with raw values.",
  },
];

const TRUST_SIGNALS = [
  {
    icon: <Zap className="w-5 h-5 text-primary" />,
    text: "Instant results — no waiting",
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-primary" />,
    text: "No signup required to start",
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-primary" />,
    text: "Real-time SEO scoring",
  },
];

export default function HomePage() {
  const [result, setResult] = React.useState<MetaResult | null>(null);
  const { user } = useAuth();
  const { isPro } = useSubscription("metatagz", user?.id);

  const handleResults = (data: MetaResult) => {
    setResult(data);
    // Scroll to results smoothly
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-primary/2 to-background py-16 md:py-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="container max-w-4xl relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Zap className="w-3 h-3" />
              Free meta tag analyzer — no signup needed
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Preview How Your Page Looks on{" "}
              <span className="text-primary">Google, Twitter &amp; More</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Enter any URL and instantly see social media previews, check Open Graph
              tags, Twitter Cards, and SEO meta tags — all in one place.
            </p>
          </div>

          {/* URL Input — the hero action */}
          <UrlInput
            onResults={handleResults}
            className="max-w-3xl mx-auto"
          />

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            {TRUST_SIGNALS.map((signal) => (
              <div
                key={signal.text}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                {signal.icon}
                {signal.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      {result && (
        <section id="results" className="py-10 container">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">Results for:</h2>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {result.url}
              </a>
            </div>
            <span className="text-xs text-muted-foreground">
              Fetched {new Date(result.fetchedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Meta Raw Data Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Title", value: result.title ? `${result.title.length} chars` : "Missing" },
              { label: "Description", value: result.description ? `${result.description.length} chars` : "Missing" },
              { label: "og:image", value: result.og.image ? "Found" : "Missing" },
              { label: "Twitter Card", value: result.twitter.card || "Missing" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border bg-card p-3 text-center"
              >
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p
                  className={`text-sm font-semibold mt-0.5 ${
                    item.value === "Missing"
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Platform Previews Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GooglePreview meta={result} />
            <TwitterPreview meta={result} />
            <FacebookPreview meta={result} isPro={isPro} />
            <LinkedInPreview meta={result} isPro={isPro} />
            <SlackPreview meta={result} isPro={isPro} />

            {/* Raw tags card */}
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold mb-3">Raw Meta Tags</h3>
              <div className="space-y-2 text-xs font-mono overflow-auto max-h-64">
                {[
                  ["title", result.title],
                  ["description", result.description],
                  ["canonical", result.canonical],
                  ["robots", result.robots],
                  ["og:title", result.og.title],
                  ["og:description", result.og.description],
                  ["og:image", result.og.image],
                  ["og:url", result.og.url],
                  ["og:type", result.og.type],
                  ["og:site_name", result.og.siteName],
                  ["twitter:card", result.twitter.card],
                  ["twitter:title", result.twitter.title],
                  ["twitter:description", result.twitter.description],
                  ["twitter:image", result.twitter.image],
                  ["twitter:creator", result.twitter.creator],
                ].map(([key, value]) => (
                  <div key={key} className="flex gap-2 flex-wrap">
                    <span className="text-primary shrink-0">{key}:</span>
                    <span className="text-muted-foreground break-all">
                      {value || <em className="text-destructive not-italic">(not set)</em>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ad banner for free users */}
          {!isPro && (
            <div className="mt-8 flex justify-center">
              <AdBanner slot="metatagz-results" format="leaderboard" />
            </div>
          )}
        </section>
      )}

      {/* Features Grid */}
      {!result && (
        <section className="py-16 container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              Everything You Need to Preview Your Links
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              MetaTagz checks all the meta tags that matter for SEO and social sharing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  {feature.pro && (
                    <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      {!result && (
        <section className="py-16 bg-primary/5 border-t">
          <div className="container text-center max-w-2xl">
            <h2 className="text-2xl font-bold mb-3">
              Ready to check your meta tags?
            </h2>
            <p className="text-muted-foreground mb-6">
              Paste any URL above to get an instant preview — no account needed.
              Upgrade to Pro for unlimited checks and all platform previews.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Check a URL Now
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-2.5 rounded-md font-semibold text-sm hover:bg-primary/5 transition-colors"
              >
                View Pro Features
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
