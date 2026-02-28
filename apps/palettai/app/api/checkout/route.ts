export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@repo/billing";
import { createClient } from "@repo/auth/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = request.headers.get("origin") || "http://localhost:3003";

    const checkoutSession = await createCheckoutSession({
      app: "palettai",
      userId: session.user.id,
      userEmail: session.user.email!,
      successUrl: `${origin}/dashboard?upgraded=true`,
      cancelUrl: `${origin}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
