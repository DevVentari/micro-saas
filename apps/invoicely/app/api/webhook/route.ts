export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { constructWebhookEvent, handleWebhookEvent } from "@repo/billing";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";

// Use the service role client (bypasses RLS) for webhook updates
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
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  try {
    await handleWebhookEvent(event, {
      onSubscriptionCreated: async (subscription) => {
        const userId = subscription.metadata?.userId;
        const app = subscription.metadata?.app ?? "invoicely";

        if (!userId) {
          console.error("No userId in subscription metadata");
          return;
        }

        type AnyRecord = Record<string, number | undefined>;
        const periodEnd =
          (subscription as unknown as AnyRecord).current_period_end ??
          (subscription.items?.data?.[0] as unknown as AnyRecord)?.current_period_end;

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            app,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            plan: "pro",
            status: subscription.status,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          },
          { onConflict: "user_id,app" }
        );
      },

      onSubscriptionUpdated: async (subscription) => {
        const userId = subscription.metadata?.userId;
        const app = subscription.metadata?.app ?? "invoicely";

        if (!userId) return;

        const plan =
          subscription.status === "active" ||
          subscription.status === "trialing"
            ? "pro"
            : "free";

        type AnyRecord = Record<string, number | undefined>;
        const periodEnd =
          (subscription as unknown as AnyRecord).current_period_end ??
          (subscription.items?.data?.[0] as unknown as AnyRecord)?.current_period_end;

        await supabase
          .from("subscriptions")
          .update({
            stripe_subscription_id: subscription.id,
            plan,
            status: subscription.status,
            current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          })
          .eq("user_id", userId)
          .eq("app", app);
      },

      onSubscriptionDeleted: async (subscription) => {
        const userId = subscription.metadata?.userId;
        const app = subscription.metadata?.app ?? "invoicely";

        if (!userId) return;

        await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("user_id", userId)
          .eq("app", app);
      },

      onPaymentSucceeded: async (invoice) => {
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) return;

        // Update subscription to active after successful payment
        await supabase
          .from("subscriptions")
          .update({ status: "active", plan: "pro" })
          .eq("stripe_subscription_id", subscriptionId);
      },

      onPaymentFailed: async (invoice) => {
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) return;

        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", subscriptionId);
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
