export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, handleWebhookEvent } from "@repo/billing";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* ignore */ }
        },
      },
    }
  );

  async function upsertSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    const app = subscription.metadata?.app || "palettai";
    if (!userId) { console.warn("No userId in subscription metadata"); return; }

    await supabase.from("subscriptions").upsert({
      user_id: userId, app,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan: subscription.status === "active" ? "pro" : "free",
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  }

  try {
    await handleWebhookEvent(event, {
      onSubscriptionCreated: upsertSubscription,
      onSubscriptionUpdated: upsertSubscription,
      onSubscriptionDeleted: async (subscription) => {
        const userId = subscription.metadata?.userId;
        const app = subscription.metadata?.app || "palettai";
        if (!userId) return;
        await supabase.from("subscriptions")
          .update({ plan: "free", status: "canceled" })
          .eq("user_id", userId).eq("app", app);
      },
      onPaymentSucceeded: async (invoice) => { console.log("Payment succeeded:", invoice.id); },
      onPaymentFailed: async (invoice) => { console.error("Payment failed:", invoice.id); },
    });
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
