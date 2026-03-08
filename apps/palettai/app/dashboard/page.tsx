"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Palette, Lock, Calendar, Loader2 } from "lucide-react";
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
  const [managingPortal, setManagingPortal] = React.useState(false);
  const [portalError, setPortalError] = React.useState<string | null>(null);

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to open billing portal:", data);
        setPortalError("Could not open billing portal. Please try again.");
        setManagingPortal(false);
        return;
      }
      const data = await res.json();
      if (!data.url) {
        setPortalError("Could not open billing portal. Please try again.");
        setManagingPortal(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      console.error("Failed to open billing portal:", err);
      setPortalError("Could not open billing portal. Please try again.");
      setManagingPortal(false);
    }
  };

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
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Palette className="size-8 animate-pulse text-primary" />
          <p className="text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-muted/20 py-8">
      <div className="container">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-balance text-2xl font-bold text-foreground sm:text-3xl">Palette Library</h1>
            <p className="mt-1 text-muted-foreground">
              {user.email} -{" "}
              <span className={cn("font-medium", isPro ? "text-primary" : "text-muted-foreground")}>
                {isPro ? "Pro Plan" : "Free Plan"}
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 self-start sm:self-auto">
            <div className="flex items-center gap-3">
              {isPro && (
                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={managingPortal}>
                  {managingPortal ? (
                    <>
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    "Manage subscription"
                  )}
                </Button>
              )}
              <Button onClick={() => router.push("/")} className="flex items-center gap-2">
                <Plus className="size-4" />
                Generate New Palette
              </Button>
            </div>
            {portalError && <p className="mt-1 text-xs text-destructive">{portalError}</p>}
          </div>
        </div>

        {!isPro && (
          <div className="mb-8 flex flex-col items-start gap-4 rounded-xl border border-primary/25 bg-card p-6 sm:flex-row sm:items-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Lock className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Saving palettes is a Pro feature</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Upgrade to store unlimited palettes and reuse approved color systems across projects.
              </p>
            </div>
            <Button onClick={() => router.push("/pricing")} className="shrink-0">
              Upgrade to Pro
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-destructive">{error}</p>
          </div>
        ) : palettes.length === 0 ? (
          <div className="py-20 text-center">
            <Palette className="mx-auto mb-4 size-16 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold text-foreground">No saved palettes yet</h2>
            <p className="mb-6 mt-2 text-muted-foreground">
              {isPro ? "Generate a palette and save it to your library." : "Upgrade to Pro to start saving palettes."}
            </p>
            <Button onClick={() => router.push(isPro ? "/" : "/pricing")}>{isPro ? "Generate a Palette" : "Upgrade to Pro"}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    <Card className="group overflow-hidden transition-shadow duration-200 hover:shadow-lg">
      <div className="flex h-24 overflow-hidden">
        {palette.colors.map((color) => (
          <div
            key={color.role}
            className="flex-1 origin-top transition-transform duration-200 group-hover:scale-y-110"
            style={{ backgroundColor: color.hex }}
            title={`${color.name} (${color.hex})`}
          />
        ))}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="truncate text-base">{palette.name || palette.palette_name}</CardTitle>
        {palette.description && <CardDescription className="line-clamp-2 text-xs">{palette.description}</CardDescription>}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3 flex flex-wrap gap-2">
          {palette.colors.map((color) => (
            <div key={color.role} className="flex items-center gap-1">
              <div className="size-4 rounded-full border border-border/60 shadow-sm" style={{ backgroundColor: color.hex }} title={color.name} />
              <span className="font-mono text-xs text-muted-foreground">{color.hex}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3" />
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
