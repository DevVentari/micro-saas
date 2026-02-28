"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Download, Palette, Lock, Calendar } from "lucide-react";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { ExportMenu } from "@/components/export-menu";
import type { ColorEntry } from "@/lib/export";

interface SavedPalette {
  id: string;
  name: string;
  palette_name: string;
  colors: Array<{
    hex: string;
    name: string;
    role: "primary" | "secondary" | "accent" | "neutral" | "background";
  }>;
  description?: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: subLoading } = useSubscription("palettai", user?.id);

  const [palettes, setPalettes] = React.useState<SavedPalette[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/dashboard");
    }
  }, [authLoading, user, router]);

  React.useEffect(() => {
    if (!user) return;

    async function fetchPalettes() {
      try {
        const res = await fetch("/api/palettes");
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to load palettes");
          return;
        }
        const data = await res.json();
        setPalettes(data.palettes || []);
      } catch {
        setError("Failed to load palettes");
      } finally {
        setLoading(false);
      }
    }

    fetchPalettes();
  }, [user]);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Palette className="w-8 h-8 animate-pulse text-violet-500" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/20 py-8">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              My Palettes
            </h1>
            <p className="text-muted-foreground mt-1">
              {user.email} &mdash;{" "}
              <span
                className={cn(
                  "font-medium",
                  isPro ? "text-violet-600" : "text-muted-foreground"
                )}
              >
                {isPro ? "Pro Plan" : "Free Plan"}
              </span>
            </p>
          </div>
          <Button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Generate New Palette
          </Button>
        </div>

        {/* Pro gate */}
        {!isPro && (
          <div className="mb-8 rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50">
              <Lock className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Saving palettes requires Pro</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upgrade to Pro to save unlimited palettes, organize collections, and share with
                your team.
              </p>
            </div>
            <Button onClick={() => router.push("/pricing")} className="shrink-0">
              Upgrade to Pro
            </Button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-red-500">{error}</p>
          </div>
        ) : palettes.length === 0 ? (
          <div className="text-center py-20">
            <Palette className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No saved palettes yet</h2>
            <p className="text-muted-foreground mb-6">
              {isPro
                ? "Generate a palette and save it to your collection."
                : "Upgrade to Pro to start saving palettes."}
            </p>
            <Button onClick={() => router.push(isPro ? "/" : "/pricing")}>
              {isPro ? "Generate a Palette" : "Upgrade to Pro"}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {palettes.map((palette) => (
              <PaletteCard key={palette.id} palette={palette} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaletteCard({ palette }: { palette: SavedPalette }) {
  const colorEntries: ColorEntry[] = palette.colors.map((c) => ({
    hex: c.hex,
    name: c.name,
    role: c.role,
  }));

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      {/* Color strip */}
      <div className="flex h-24 overflow-hidden">
        {palette.colors.map((color) => (
          <div
            key={color.role}
            className="flex-1 transition-transform duration-300 group-hover:scale-y-110 origin-top"
            style={{ backgroundColor: color.hex }}
            title={`${color.name} (${color.hex})`}
          />
        ))}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-base truncate">{palette.name || palette.palette_name}</CardTitle>
        {palette.description && (
          <CardDescription className="text-xs line-clamp-2">
            {palette.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Hex swatches row */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {palette.colors.map((color) => (
            <div key={color.role} className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded-full border border-border/60 shadow-sm"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
              <span className="text-xs font-mono text-muted-foreground">{color.hex}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(palette.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <ExportMenu colors={colorEntries} />
        </div>
      </CardContent>
    </Card>
  );
}
