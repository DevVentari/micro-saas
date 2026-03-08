"use client";

import * as React from "react";
import { Sparkles, Zap, Palette, Download, CheckCircle2, FolderKanban, ShieldCheck } from "lucide-react";
import { cn } from "@repo/ui";
import { AdBanner } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { PromptInput } from "@/components/prompt-input";
import { PaletteDisplay } from "@/components/palette-display";
import type { GeneratedPalette } from "@/lib/ai";
import { usePaletteTheme } from "@/components/palette-theme-provider";

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
  const { applyPalette } = usePaletteTheme();
  const [palette, setPalette] = React.useState<GeneratedPalette | null>(null);
  const [currentMood, setCurrentMood] = React.useState<string>("balanced");
  const [error, setError] = React.useState<string | null>(null);
  const [remaining, setRemaining] = React.useState(5);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);

  const paletteRef = React.useRef<HTMLDivElement>(null);

  function handleGenerated(newPalette: GeneratedPalette, newRemaining: number, mood: string) {
    setPalette(newPalette);
    setCurrentMood(mood);
    setRemaining(newRemaining);
    setError(null);
    setSaveMessage(null);
    applyPalette(newPalette, mood);
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

  function handleOpenStudio() {
    if (!palette) return;
    sessionStorage.setItem("studio_palette", JSON.stringify({ palette, mood: currentMood }));
    window.location.href = "/studio";
  }

  return (
    <div className="min-h-dvh bg-background">
      <section className="container py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="space-y-7 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="size-4" />
              Professional color systems in seconds
            </div>

            <h1
              className="font-display text-balance text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
              style={{ fontWeight: "var(--mood-weight, 700)" }}
            >
              Build production-ready palettes with semantic roles, not random hex picks.
            </h1>

            <p className="text-pretty max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Describe your product vibe and instantly get a 5-color system with role names, contrast-safe structure, and exports ready for your stack.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Role-based output: primary, secondary, accent, neutral, background",
                "One-click exports for CSS variables, Tailwind, Figma, JSON, and SVG",
                "No signup required for free usage",
                "Palette-aware live theming while you iterate",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl border border-border bg-card p-3">
                  <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Palettes Generated", value: "10,000+" },
                { label: "Generation Time", value: "< 5 sec" },
                { label: "Export Formats", value: "6+" },
                { label: "Free Daily", value: "5 / day" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-border bg-card p-3">
                  <p className="text-lg font-semibold tabular-nums text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div
              className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
              style={{ borderRadius: "var(--mood-radius, 1rem)" }}
            >
              <h2 className="text-balance text-xl font-semibold text-foreground">Generate Your Palette</h2>
              <p className="text-pretty mt-1 text-sm text-muted-foreground">
                Start with your brand, product, or mood prompt and refine from there.
              </p>

              <div className="mt-5">
                <PromptInput
                  onGenerated={handleGenerated}
                  onError={handleError}
                  initialRemaining={remaining}
                  isPro={isPro}
                />
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                  {error}
                </div>
              )}

              {saveMessage && (
                <div
                  className={cn(
                    "mt-4 rounded-xl border px-4 py-3 text-sm",
                    saveMessage.includes("saved")
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                  )}
                >
                  {saveMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {palette && (
          <div ref={paletteRef} className="mx-auto mt-8 max-w-5xl">
            <PaletteDisplay
              palette={palette}
              onRegenerate={() => setPalette(null)}
              onSave={handleSave}
              onOpenStudio={handleOpenStudio}
              isSaving={isSaving}
              isPro={isPro}
              isLoggedIn={!!user}
            />
          </div>
        )}
      </section>

      {!isPro && (
        <section className="container pb-6">
          <AdBanner slot="palettai-home-top" format="leaderboard" />
        </section>
      )}

      <section className="border-y border-border bg-muted/20 py-12 sm:py-14">
        <div className="container">
          <div className="mb-7 text-center">
            <h2 className="text-balance text-2xl font-bold text-foreground sm:text-3xl">Built for Product Teams, Not Just Inspiration Boards</h2>
            <p className="text-pretty mx-auto mt-2 max-w-2xl text-muted-foreground">
              PalettAI outputs palettes that map directly to UI systems, so design and engineering can ship faster.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Palette className="size-5 text-primary" />,
                title: "Semantic Structure",
                description: "Every color is assigned a functional role, making implementation predictable.",
              },
              {
                icon: <Download className="size-5 text-primary" />,
                title: "Engineering-Ready Exports",
                description: "Export formats align with real frontend workflows, not design toy formats.",
              },
              {
                icon: <FolderKanban className="size-5 text-primary" />,
                title: "Save and Reuse",
                description: "Pro users can save approved palettes and reuse them across projects.",
              },
              {
                icon: <Sparkles className="size-5 text-primary" />,
                title: "Prompt-Aware AI",
                description: "Generation reflects product context, mood, and brand positioning in one pass.",
              },
              {
                icon: <ShieldCheck className="size-5 text-primary" />,
                title: "Consistent Quality",
                description: "Color sets are balanced for readability and coherent visual hierarchy.",
              },
              {
                icon: <Zap className="size-5 text-primary" />,
                title: "Fast Iteration Loop",
                description: "Go from prompt to shipped palette in minutes with regenerate and tweak controls.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">{feature.icon}</div>
                <h3 className="mt-4 text-balance text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="text-pretty mt-1 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-14 sm:py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="text-balance text-2xl font-bold text-foreground sm:text-3xl">Reference Output Quality</h2>
            <p className="text-pretty mx-auto mt-2 max-w-2xl text-muted-foreground">
              Examples generated from different product categories and brand directions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_PALETTES.map((sample) => (
              <div key={sample.name} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex h-36">
                  {sample.colors.map((color) => (
                    <div key={color.role} className="flex-1" style={{ backgroundColor: color.hex }} />
                  ))}
                </div>
                <div className="px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">{sample.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{sample.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sample.colors.map((color) => (
                      <span key={color.hex} className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
                        <span className="inline-block size-3 rounded-full border border-border/50" style={{ backgroundColor: color.hex }} />
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

      <section className="container py-14 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-secondary p-8 text-center sm:p-10">
          <h2 className="font-display text-balance text-2xl font-bold text-foreground sm:text-3xl">Move from trial usage to production workflow.</h2>
          <p className="text-pretty mx-auto mt-3 max-w-xl text-muted-foreground">
            Pro gives unlimited generations, saved palettes, and all export formats so your team can standardize brand color decisions.
          </p>
          <a
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground"
          >
            <Zap className="size-4" />
            Upgrade to Pro - $5/mo
          </a>
          <p className="mt-4 text-xs text-muted-foreground">Cancel any time. No contracts.</p>
        </div>
      </section>

      {!isPro && (
        <div className="container pb-8">
          <AdBanner slot="palettai-home-bottom" format="banner" />
        </div>
      )}
    </div>
  );
}
