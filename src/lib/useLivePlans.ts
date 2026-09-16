import { useEffect, useState } from 'react';
import { fetchLivePlans } from '@/lib/site';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/subscriptions';

/** Live plan prices from the owner's settings, falling back to the built-in defaults. */
export function useLivePlans(): SubscriptionPlan[] {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);

  useEffect(() => {
    let active = true;
    void fetchLivePlans()
      .then((rows) => {
        if (active) setPlans(rows);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return plans;
}
