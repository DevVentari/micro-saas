"use client";

import * as React from "react";
import { useAuth } from "@repo/auth";
import { useSubscription } from "@repo/billing";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { UrlInput } from "@/components/url-input";
import type { MetaResult } from "@/lib/og-parser";
import {
  Clock,
  ExternalLink,
  Lock,
  Loader2,
  Search,
  AlertCircle,
  BarChart2,
  Globe,
} from "lucide-react";
import Link from "next/link";

interface CheckHistory {
  id: string;
  url: string;
  checked_at: string;
  title?: string;
  favicon?: string;
  og_image?: string;
}

function HistoryRow({ item }: { item: CheckHistory }) {
  let domain = "";
  try {
    domain = new URL(item.url).hostname;
  } catch {
    domain = item.url;
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0 hover:bg-muted/30 rounded px-2 -mx-2 transition-colors group">
      {item.favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.favicon}
          alt=""
          width={16}
          height={16}
          className="rounded-sm shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {item.title || domain}
        </p>
        <p className="text-xs text-muted-foreground truncate">{item.url}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground hidden sm:block">
          {new Date(item.checked_at).toLocaleDateString()}
        </span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        </a>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { isPro, loading: subLoading } = useSubscription("metatagz", user?.id);
  const router = useRouter();
  const [history, setHistory] = React.useState<CheckHistory[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [showAnalyzer, setShowAnalyzer] = React.useState(false);
  const [managingPortal, setManagingPortal] = React.useState(false);
  const [portalError, setPortalError] = React.useState<string | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?next=/dashboard");
    }
  }, [authLoading, user, router]);

  // Load history for pro users
  React.useEffect(() => {
    if (!user || !isPro) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await fetch("/api/history");
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        } else {
          setHistoryError("Failed to load history");
        }
      } catch {
        setHistoryError("Network error loading history");
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [user, isPro]);

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

  if (authLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const stats = [
    {
      label: "Plan",
      value: isPro ? "Pro" : "Free",
      icon: <BarChart2 className="w-4 h-4 text-primary" />,
    },
    {
      label: "URLs Checked",
      value: isPro ? history.length : "—",
      icon: <Search className="w-4 h-4 text-primary" />,
    },
    {
      label: "Daily Limit",
      value: isPro ? "Unlimited" : "5 / day",
      icon: <Clock className="w-4 h-4 text-primary" />,
    },
  ];

  return (
    <div className="container py-10 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.email}
          </p>
        </div>
        <Button onClick={() => setShowAnalyzer((p) => !p)}>
          {showAnalyzer ? "Hide Analyzer" : "Check Another URL"}
        </Button>
      </div>

      {/* Inline URL analyzer */}
      {showAnalyzer && (
        <div className="mb-8 p-6 rounded-xl border bg-card">
          <h2 className="text-sm font-semibold mb-4">Analyze a URL</h2>
          <UrlInput
            onResults={(result: MetaResult) => {
              setShowAnalyzer(false);
              router.push(`/?url=${encodeURIComponent(result.url)}`);
            }}
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pro gate for history */}
      {!isPro ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              URL Check History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">History is a Pro Feature</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Upgrade to Pro to save your URL check history, see past results,
                and access bulk checking and monitoring alerts.
              </p>
              <Link href="/pricing">
                <Button>Upgrade to Pro — $8/mo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent URL Checks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : historyError ? (
              <div className="flex items-center gap-2 text-sm text-destructive py-6">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {historyError}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No URL checks yet. Analyze your first URL to get started.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAnalyzer(true)}
                >
                  Check a URL
                </Button>
              </div>
            ) : (
              <div>
                {history.map((item) => (
                  <HistoryRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account info */}
      <div className="mt-8 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold mb-3">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Plan</span>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                <span
                  className={`font-medium ${isPro ? "text-primary" : "text-foreground"}`}
                >
                  {isPro ? "Pro" : "Free"}
                </span>
                {isPro && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={managingPortal}
                  >
                    {managingPortal ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        Opening…
                      </>
                    ) : (
                      "Manage subscription"
                    )}
                  </Button>
                )}
              </div>
              {portalError && (
                <p className="text-xs text-destructive mt-1">{portalError}</p>
              )}
            </div>
          </div>
          {!isPro && (
            <div className="pt-2">
              <Link href="/pricing">
                <Button variant="outline" size="sm">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
