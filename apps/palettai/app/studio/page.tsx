"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Layers, Image, CreditCard, Layout } from "lucide-react";
import { cn } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { ShadesSection } from "@/components/studio/ShadesSection";
import { ProGate } from "@/components/studio/ProGate";
import type { GeneratedPalette } from "@/lib/ai";

// Lazy-load heavy sections to avoid importing html-to-image on initial load
const MoodboardSection = React.lazy(() =>
  import("@/components/studio/MoodboardSection").then((m) => ({ default: m.MoodboardSection }))
);
const StyleCardSection = React.lazy(() =>
  import("@/components/studio/StyleCardSection").then((m) => ({ default: m.StyleCardSection }))
);
const ComponentPreviewSection = React.lazy(() =>
  import("@/components/studio/ComponentPreviewSection").then((m) => ({ default: m.ComponentPreviewSection }))
);

const TABS = [
  { id: "shades", label: "Shades", icon: Layers },
  { id: "moodboard", label: "Moodboard", icon: Image },
  { id: "stylecard", label: "Style Card", icon: CreditCard },
  { id: "components", label: "Components", icon: Layout },
] as const;

type TabId = typeof TABS[number]["id"];

export default function StudioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPro, loading: isProLoading } = useSubscription("palettai", user?.id);
  const [palette, setPalette] = React.useState<GeneratedPalette | null>(null);
  const [mood, setMood] = React.useState<string>("balanced");
  const [activeTab, setActiveTab] = React.useState<TabId>("shades");
  const [visitedTabs, setVisitedTabs] = React.useState<Set<TabId>>(new Set(["shades"]));

  React.useEffect(() => {
    const stored = sessionStorage.getItem("studio_palette");
    if (!stored) {
      router.replace("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { palette: GeneratedPalette; mood: string };
      setPalette(parsed.palette);
      setMood(parsed.mood ?? "balanced");
    } catch {
      router.replace("/");
    }
  }, [router]);

  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    setVisitedTabs((prev) => new Set([...prev, tab]));
  }

  if (!palette) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading studio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex gap-1">
              {palette.colors.map((c) => (
                <span
                  key={c.role}
                  className="inline-block size-4 rounded-full border border-border/50"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <span className="truncate text-sm font-medium text-foreground">
              {palette.paletteName}
            </span>
          </div>
        </div>

        {/* Tab nav */}
        <div className="container">
          <div role="tablist" className="flex gap-0 border-t border-border/50 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8">
        {/* Always render shades (cheap, instant) */}
        <div className={activeTab === "shades" ? "block" : "hidden"}>
          <ShadesSection palette={palette} />
        </div>

        {/* Lazy sections — only mount when first visited */}
        <React.Suspense fallback={<SectionSkeleton />}>
          {!isProLoading && visitedTabs.has("moodboard") && (
            <div className={activeTab === "moodboard" ? "block" : "hidden"}>
              <ProGate isPro={isPro} featureName="AI Moodboard">
                <MoodboardSection palette={palette} mood={mood} />
              </ProGate>
            </div>
          )}
          {!isProLoading && visitedTabs.has("stylecard") && (
            <div className={activeTab === "stylecard" ? "block" : "hidden"}>
              <ProGate isPro={isPro} featureName="Style Card">
                <StyleCardSection palette={palette} mood={mood} />
              </ProGate>
            </div>
          )}
          {!isProLoading && visitedTabs.has("components") && (
            <div className={activeTab === "components" ? "block" : "hidden"}>
              <ProGate isPro={isPro} featureName="Component Preview">
                <ComponentPreviewSection palette={palette} />
              </ProGate>
            </div>
          )}
        </React.Suspense>
      </main>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 rounded-lg bg-muted" />
      <div className="h-4 w-72 rounded-lg bg-muted" />
      <div className="grid grid-cols-3 gap-3 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
