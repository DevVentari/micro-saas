export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createCheckoutSession } from "@repo/billing";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // ignore from Server Component
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      request.nextUrl.origin ??
      "http://localhost:3002";

    const checkoutSession = await createCheckoutSession({
      app: "metatagz",
      userId: user.id,
      userEmail: user.email!,
      successUrl: `${origin}/dashboard?upgraded=true`,
      cancelUrl: `${origin}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("[checkout] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
