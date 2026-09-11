export type SubscriptionPlanKey = 'silver' | 'gold' | 'diamond';

export interface SubscriptionPlan {
  key: SubscriptionPlanKey;
  name: string;
  duration: string;
  price: number;
  priceLabel: string;
  userLimit: number;
  durationDays: number;
  featured?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { key: 'silver', name: 'Silver', duration: 'Weekly', price: 399, priceLabel: 'Rs. 399', userLimit: 1, durationDays: 7 },
  { key: 'gold', name: 'Gold', duration: '3 Months', price: 4999, priceLabel: 'Rs. 4,999', userLimit: 3, durationDays: 90, featured: true },
  { key: 'diamond', name: 'Diamond', duration: '1 Year', price: 10500, priceLabel: 'Rs. 10,500', userLimit: 5, durationDays: 365 },
];

export function getSubscriptionPlan(key: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.key === key);
}
