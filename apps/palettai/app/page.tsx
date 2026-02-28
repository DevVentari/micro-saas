"use client";

import * as React from "react";
import { Sparkles, Zap, Palette, Download, Shield } from "lucide-react";
import { cn } from "@repo/ui";
import { AdBanner } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { PromptInput } from "@/components/prompt-input";
import { PaletteDisplay } from "@/components/palette-display";
import type { GeneratedPalette } from "@/lib/ai";

// Sample palettes for the gallery
const SAMPLE_PALETTES: Array<{
  name: string;
  description: string;
  colors: Array<{ hex: string; name: string; role: GeneratedPalette["colors"][0]["role"] }>;
}> = [
  {
    name: "Ocean Depths",
    description: "Calming ocean blues for wellness brands",
    colors: [
      { hex: "#0077B6", name: "Deep Ocean", role: "primary" },
      { hex: "#0096C7", name: "Cerulean", role: "secondary" },
      { hex: "#48CAE4", name: "Aqua", role: "accent" },
      { hex: "#90E0EF", name: "Sky Mist", role: "neutral" },
      { hex: "#F0FAFB", name: "Sea Foam", role: "background" },
    ],
  },
  {
    name: "Forest Canopy",
    description: "Natural greens for eco-conscious brands",
    colors: [
      { hex: "#2D6A4F", name: "Forest", role: "primary" },
      { hex: "#40916C", name: "Emerald", role: "secondary" },
      { hex: "#74C69D", name: "Sage", role: "accent" },
      { hex: "#D8F3DC", name: "Mint Mist", role: "neutral" },
      { hex: "#F7FFF7", name: "Ivory", role: "background" },
    ],
  },
  {
    name: "Sunset Fire",
    description: "Warm oranges for energetic, bold brands",
    colors: [
      { hex: "#E63946", name: "Crimson", role: "primary" },
      { hex: "#F4722B", name: "Flame", role: "secondary" },
      { hex: "#F9A825", name: "Amber", role: "accent" },
      { hex: "#FDE68A", name: "Honey", role: "neutral" },
      { hex: "#FFF8F0", name: "Cream", role: "background" },
    ],
  },
  {
    name: "Midnight Tech",
    description: "Dark mode palette for developer tools",
    colors: [
      { hex: "#7C3AED", name: "Violet", role: "primary" },
      { hex: "#3B82F6", name: "Electric Blue", role: "secondary" },
      { hex: "#06B6D4", name: "Cyan", role: "accent" },
      { hex: "#1E293B", name: "Slate Dark", role: "neutral" },
      { hex: "#0F172A", name: "Abyss", role: "background" },
    ],
  },
  {
    name: "Rose Gold",
    description: "Elegant pinks for luxury brands",
    colors: [
      { hex: "#BE185D", name: "Raspberry", role: "primary" },
      { hex: "#DB2777", name: "Hot Pink", role: "secondary" },
      { hex: "#F9A8D4", name: "Blush", role: "accent" },
      { hex: "#FDE8F0", name: "Petal", role: "neutral" },
      { hex: "#FFF5F9", name: "Pearl", role: "background" },
    ],
  },
  {
    name: "Nordic Frost",
    description: "Clean whites and grays for minimalist brands",
    colors: [
      { hex: "#374151", name: "Charcoal", role: "primary" },
      { hex: "#6B7280", name: "Slate", role: "secondary" },
      { hex: "#A78BFA", name: "Lavender", role: "accent" },
      { hex: "#E5E7EB", name: "Silver", role: "neutral" },
      { hex: "#F9FAFB", name: "Snow", role: "background" },
    ],
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const { isPro } = useSubscription("palettai", user?.id);
  const [palette, setPalette] = React.useState<GeneratedPalette | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [remaining, setRemaining] = React.useState(5);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  const paletteRef = React.useRef<HTMLDivElement>(null);

  function handleGenerated(newPalette: GeneratedPalette, newRemaining: number) {
    setPalette(newPalette);
    setRemaining(newRemaining);
    setError(null);
    setSaveMessage(null);
    // Scroll to palette
    setTimeout(() => {
      paletteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleError(err: string) {
    setError(err);
    setPalette(null);
  }

  async function handleSave() {
    if (!palette) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/palettes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(palette),
      });
      if (res.ok) {
        setSaveMessage("Palette saved to your dashboard!");
      } else {
        const data = await res.json();
        setSaveMessage(data.error || "Failed to save palette.");
      }
    } catch {
      setSaveMessage("Failed to save palette. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero / Generator Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white dark:from-violet-950/20 dark:via-background dark:to-background py-16 sm:py-24">
        {/* Background decoration */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-violet-200/40 to-purple-200/20 rounded-full blur-3xl" />
        </div>

        <div className="container relative">
          {/* Heading */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by Claude AI
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-5">
              Generate Beautiful
              <span className="block bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
                Color Palettes with AI
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Describe your brand, mood, or style — get a perfect 5-color palette instantly.
              Export to CSS, Tailwind, Figma, and more.
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              No signup required for{" "}
              <span className="font-semibold text-violet-600">5 free generations/day</span>
            </p>
          </div>

          {/* Generator card */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-xl p-6 sm:p-8">
              <PromptInput
                onGenerated={handleGenerated}
                onError={handleError}
                initialRemaining={remaining}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Save feedback */}
            {saveMessage && (
              <div
                className={cn(
                  "mt-4 rounded-xl border px-4 py-3 text-sm",
                  saveMessage.includes("saved")
                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
                    : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
                )}
              >
                {saveMessage}
              </div>
            )}
          </div>

          {/* Generated palette */}
          {palette && (
            <div ref={paletteRef} className="max-w-5xl mx-auto mt-8">
              <PaletteDisplay
                palette={palette}
                onRegenerate={() => setPalette(null)}
                onSave={handleSave}
                isSaving={isSaving}
                isPro={isPro}
                isLoggedIn={!!user}
              />
            </div>
          )}
        </div>
      </section>

      {/* Ad Banner (free tier) */}
      {!isPro && (
        <section className="container py-4">
          <AdBanner slot="palettai-home-top" format="leaderboard" />
        </section>
      )}

      {/* Feature highlights */}
      <section className="container py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Sparkles className="w-5 h-5 text-violet-600" />,
              title: "AI-Powered",
              description:
                "Claude AI understands context, mood, and aesthetics to generate cohesive, professional palettes.",
            },
            {
              icon: <Palette className="w-5 h-5 text-violet-600" />,
              title: "5 Colors + Roles",
              description:
                "Every palette includes primary, secondary, accent, neutral, and background — everything you need.",
            },
            {
              icon: <Download className="w-5 h-5 text-violet-600" />,
              title: "Instant Export",
              description:
                "Copy CSS variables, Tailwind config, Figma JSON, SVG, or raw JSON with one click.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample palettes gallery */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Example Palettes
            </h2>
            <p className="text-muted-foreground">
              Palettes generated by AI for different brands and moods
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_PALETTES.map((sample) => (
              <div
                key={sample.name}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                {/* Color strip */}
                <div className="flex h-20">
                  {sample.colors.map((color) => (
                    <div
                      key={color.role}
                      className="flex-1"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
                {/* Info */}
                <div className="px-4 py-3">
                  <h3 className="font-semibold text-sm text-foreground">{sample.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{sample.description}</p>
                  {/* Hex chips */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sample.colors.map((color) => (
                      <span
                        key={color.hex}
                        className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground"
                      >
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-border/50"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.hex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 text-center">
        <div className="max-w-xl mx-auto">
          <Shield className="w-10 h-10 text-violet-600 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Want unlimited palettes?
          </h2>
          <p className="text-muted-foreground mb-6">
            Upgrade to Pro for unlimited AI generations, no ads, save your favorite palettes,
            and export in all formats.
          </p>
          <a
            href="/pricing"
            className={cn(
              "inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-200 hover:-translate-y-0.5"
            )}
          >
            <Zap className="w-4 h-4" />
            Upgrade to Pro — $5/mo
          </a>
        </div>
      </section>

      {/* Ad banner bottom */}
      {!isPro && (
        <div className="container pb-6">
          <AdBanner slot="palettai-home-bottom" format="banner" />
        </div>
      )}
    </div>
  );
}
