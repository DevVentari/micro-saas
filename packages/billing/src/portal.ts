import { getStripe } from "./stripe";

interface CreatePortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: CreatePortalSessionParams) {
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}
