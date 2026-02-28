import { getStripe } from "./stripe";
import type { AppName } from "@repo/types";

const PRICE_IDS: Record<AppName, string | undefined> = {
  invoicely: process.env.STRIPE_INVOICELY_PRICE_ID,
  metatagz: process.env.STRIPE_METATAGZ_PRICE_ID,
  palettai: process.env.STRIPE_PALETTAI_PRICE_ID,
};

interface CreateCheckoutSessionParams {
  app: AppName;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
}

export async function createCheckoutSession({
  app,
  userId,
  userEmail,
  successUrl,
  cancelUrl,
  customerId,
}: CreateCheckoutSessionParams) {
  const stripe = getStripe();
  const priceId = PRICE_IDS[app];

  if (!priceId) {
    throw new Error(`No Stripe price ID configured for app: ${app}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer: customerId,
    customer_email: customerId ? undefined : userEmail,
    metadata: { userId, app },
    subscription_data: {
      metadata: { userId, app },
    },
  });

  return session;
}
