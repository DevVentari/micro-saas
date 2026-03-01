export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createPortalSession } from "@repo/billing";

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

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("app", "palettai")
      .maybeSingle();

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      request.nextUrl.origin ??
      "http://localhost:3003";

    const session = await createPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl: `${origin}/dashboard`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "No redirect URL returned from Stripe" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create portal session";
    console.error("[billing/portal] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
