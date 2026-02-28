export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, handleWebhookEvent } from "@repo/billing";
import { createServerClient } from "@repo/auth";
import { cookies } from "next/headers";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(payload, signature);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Use service role client for webhook operations
  const cookieStore = cookies();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient(cookieStore as any) as any;

  async function upsertSubscription(subscription: Stripe.Subscription) {
    const userId = subscription.metadata?.userId;
    const app = subscription.metadata?.app;

    if (!userId || !app) {
      console.error("[webhook] Missing userId or app in subscription metadata");
      return;
    }

    const plan = subscription.status === "active" ? "pro" : "free";
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : (subscription.customer as Stripe.Customer)?.id;

    await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          app,
          plan,
          status: subscription.status,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
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
        const app = subscription.metadata?.app;
        if (!userId || !app) return;

        await supabase
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              app,
              plan: "free",
              status: "canceled",
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,app" }
          );
      },
      onPaymentSucceeded: async (invoice) => {
        console.log("[webhook] Payment succeeded for invoice:", invoice.id);
      },
      onPaymentFailed: async (invoice) => {
        console.error("[webhook] Payment failed for invoice:", invoice.id);
      },
    });
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
