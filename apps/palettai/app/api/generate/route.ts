export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generatePalette } from "@/lib/ai";

// Simple in-memory rate limiter (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return { allowed: true, remaining: 4 };
  }

  if (limit.count >= 5) {
    return { allowed: false, remaining: 0 };
  }

  limit.count++;
  return { allowed: true, remaining: 5 - limit.count };
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, mood } = body as { prompt: string; mood?: string };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A prompt is required to generate a palette." },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "Prompt must be 500 characters or less." },
        { status: 400 }
      );
    }

    // Check if user is Pro (bypasses rate limit)
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    let isPro = false;
    if (user) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .eq("app", "palettai")
        .maybeSingle();
      isPro = sub?.plan === "pro" && sub?.status === "active";
    }

    // Apply rate limit only for non-Pro users
    if (!isPro) {
      const ip = getClientIp(request);
      const { allowed, remaining } = checkRateLimit(ip);

      if (!allowed) {
        return NextResponse.json(
          {
            error: "Daily limit reached. You can generate 5 palettes per day for free. Upgrade to Pro for unlimited generations.",
            limitReached: true,
          },
          {
            status: 429,
            headers: { "X-RateLimit-Remaining": "0" },
          }
        );
      }

      const palette = await generatePalette(prompt.trim(), mood || "balanced");
      return NextResponse.json(
        { palette, remaining },
        { headers: { "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    // Pro user — unlimited
    const palette = await generatePalette(prompt.trim(), mood || "balanced");
    return NextResponse.json(
      { palette, remaining: -1 },
      { headers: { "X-RateLimit-Remaining": "unlimited" } }
    );
  } catch (error: unknown) {
    console.error("Generate palette error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate palette: ${message}` },
      { status: 500 }
    );
  }
}
