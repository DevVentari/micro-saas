export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@repo/billing";
import { createServerClient } from "@repo/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient(cookieStore as any) as any;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3002";

    const checkoutSession = await createCheckoutSession({
      app: "metatagz",
      userId: session.user.id,
      userEmail: session.user.email!,
      successUrl: `${origin}/dashboard?upgrade=success`,
      cancelUrl: `${origin}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("[checkout] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
