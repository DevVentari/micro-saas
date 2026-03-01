export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { constructWebhookEvent, handleWebhookEvent } from "@repo/billing";
import type Stripe from "stripe";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  async function upsertSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    const app = subscription.metadata?.app ?? "palettai";
    if (!userId) { console.warn("[webhook] No userId in subscription metadata"); return; }

    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        app,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        plan: subscription.status === "active" || subscription.status === "trialing" ? "pro" : "free",
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      },
      { onConflict: "user_id,app" }
    );
  }

  try {
    await handleWebhookEvent(event, {
      onSubscriptionCreated: upsertSubscription,
      onSubscriptionUpdated: upsertSubscription,
      onSubscriptionDeleted: async (subscription) => {
        const userId = subscription.metadata?.userId;
        const app = subscription.metadata?.app ?? "palettai";
        if (!userId) return;
        await supabase.from("subscriptions")
          .update({ plan: "free", status: "canceled", stripe_subscription_id: null })
          .eq("user_id", userId).eq("app", app);
      },
      onPaymentSucceeded: async (invoice) => {
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) return;
        await supabase.from("subscriptions")
          .update({ status: "active", plan: "pro" })
          .eq("stripe_subscription_id", subscriptionId);
      },
      onPaymentFailed: async (invoice) => {
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) return;
        await supabase.from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", subscriptionId);
      },
    });
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
