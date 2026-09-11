import type { SubscriptionPlanKey } from './subscriptions';

export async function requireActiveSubscription(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  });
  if (isAdmin) return;

  const { data, error } = await context.supabase
    .from('subscriptions')
    .select('status, ends_at')
    .eq('user_id', context.userId)
    .maybeSingle();
  if (error) throw new Error('Could not verify your subscription. Please try again.');
  if (!data || data.status !== 'active' || new Date(data.ends_at).getTime() <= Date.now()) {
    throw new Error('Subscription Ended — Contact with NSAGPT Team');
  }
}

export function subscriptionEndDate(plan: SubscriptionPlanKey, startsAt: Date) {
  const result = new Date(startsAt);
  if (plan === 'silver') result.setUTCDate(result.getUTCDate() + 7);
  if (plan === 'gold') result.setUTCMonth(result.getUTCMonth() + 3);
  if (plan === 'diamond') result.setUTCFullYear(result.getUTCFullYear() + 1);
  return result;
}
