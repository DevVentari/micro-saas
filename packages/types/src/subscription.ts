export type AppName = "invoicely" | "metatagz" | "palettai";
export type PlanType = "free" | "pro";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export interface Subscription {
  id: string;
  user_id: string;
  app: AppName;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan: PlanType;
  status: SubscriptionStatus;
  current_period_end?: string;
  created_at: string;
}

export interface Plan {
  name: PlanType;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  stripe_price_id?: string;
}

export interface AppPlans {
  app: AppName;
  free: Plan;
  pro: Plan;
}
