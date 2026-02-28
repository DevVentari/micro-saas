import { getStripe } from "./stripe";
import type Stripe from "stripe";

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export async function handleWebhookEvent(
  event: Stripe.Event,
  handlers: {
    onSubscriptionCreated?: (subscription: Stripe.Subscription) => Promise<void>;
    onSubscriptionUpdated?: (subscription: Stripe.Subscription) => Promise<void>;
    onSubscriptionDeleted?: (subscription: Stripe.Subscription) => Promise<void>;
    onPaymentSucceeded?: (invoice: Stripe.Invoice) => Promise<void>;
    onPaymentFailed?: (invoice: Stripe.Invoice) => Promise<void>;
  }
) {
  switch (event.type) {
    case "customer.subscription.created":
      await handlers.onSubscriptionCreated?.(
        event.data.object as Stripe.Subscription
      );
      break;
    case "customer.subscription.updated":
      await handlers.onSubscriptionUpdated?.(
        event.data.object as Stripe.Subscription
      );
      break;
    case "customer.subscription.deleted":
      await handlers.onSubscriptionDeleted?.(
        event.data.object as Stripe.Subscription
      );
      break;
    case "invoice.payment_succeeded":
      await handlers.onPaymentSucceeded?.(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_failed":
      await handlers.onPaymentFailed?.(event.data.object as Stripe.Invoice);
      break;
  }
}
