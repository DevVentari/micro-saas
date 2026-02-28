export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchPageMeta } from "@/lib/meta-fetcher";
import { createServerClient } from "@repo/auth";
import { cookies } from "next/headers";

// In-memory rate limiter for anonymous users (by IP)
// In production, use Redis or Supabase for persistence
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const FREE_DAILY_LIMIT = 5;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const resetAt = todayStart.getTime() + 24 * 60 * 60 * 1000;

  const entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    // Reset or first visit
    rateLimitMap.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: FREE_DAILY_LIMIT - 1 };
  }

  if (entry.count >= FREE_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: FREE_DAILY_LIMIT - entry.count };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required and must be a string" },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const cookieStore = cookies();
    let isAuthenticated = false;
    let isPro = false;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createServerClient(cookieStore as any) as any;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        isAuthenticated = true;
        // Check subscription status
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_id", session.user.id)
          .eq("app", "metatagz")
          .single();

        isPro =
          subscription?.plan === "pro" && subscription?.status === "active";
      }
    } catch {
      // Auth check failed; treat as anonymous
    }

    // Apply rate limiting only to non-pro anonymous users
    if (!isPro) {
      const ip = getClientIp(request);
      const { allowed, remaining } = checkRateLimit(ip);

      if (!allowed && !isAuthenticated) {
        return NextResponse.json(
          {
            error: "Daily limit reached. Sign up for Pro to get unlimited checks.",
            limitReached: true,
            remaining: 0,
          },
          {
            status: 429,
            headers: { "X-RateLimit-Remaining": "0" },
          }
        );
      }

      const result = await fetchPageMeta(url);

      return NextResponse.json(
        { ...result, remaining: isAuthenticated ? null : remaining },
        {
          headers: {
            "X-RateLimit-Remaining": String(remaining),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Pro users: unlimited
    const result = await fetchPageMeta(url);
    return NextResponse.json({ ...result, remaining: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch meta tags";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
