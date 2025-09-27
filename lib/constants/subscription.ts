export const SUBSCRIPTION_PLANS = {
    FREE: "free",
    PRO: "pro",
  } as const;
  
  export type SubscriptionPlan =
    (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];
  