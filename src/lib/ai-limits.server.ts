/**
 * Server-side AI usage limits. Prevents a single account from draining AI credits
 * through scripted or duplicated requests. Never trust client counters.
 */

const BURST_WINDOW_MS = 60_000;
const BURST_MAX = 8;

const DAILY_BY_PLAN: Record<string, number> = {
  silver: 80,
  gold: 250,
  diamond: 600,
};
const DAILY_DEFAULT = 40;

export type AiFeature = 'generate' | 'notes' | 'solver' | 'ask' | 'plan' | 'support';

interface Ctx {
  supabase: any;
  userId: string;
}

/**
 * Throws a user-friendly error when the caller is over the limit,
 * otherwise records the usage event.
 */
export async function enforceAiLimit(context: Ctx, feature: AiFeature): Promise<void> {
  const { data: isAdmin } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  });
  const { data: isOwner } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'owner',
  });
  if (isAdmin || isOwner) return;

  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db = supabaseAdmin as any;

  const { data: sub } = await db
    .from('subscriptions')
    .select('plan_key, status')
    .eq('user_id', context.userId)
    .maybeSingle();
  const dailyMax =
    sub?.status === 'active' ? (DAILY_BY_PLAN[sub.plan_key as string] ?? DAILY_DEFAULT) : DAILY_DEFAULT;

  const burstSince = new Date(Date.now() - BURST_WINDOW_MS).toISOString();
  const daySince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: burst }, { count: today }] = await Promise.all([
    db
      .from('ai_usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', context.userId)
      .gte('created_at', burstSince),
    db
      .from('ai_usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', context.userId)
      .gte('created_at', daySince),
  ]);

  if ((burst ?? 0) >= BURST_MAX) {
    throw new Error('Too many AI requests in a short time. Please wait a minute and try again.');
  }
  if ((today ?? 0) >= dailyMax) {
    throw new Error(
      `You have reached your daily AI limit (${dailyMax} requests). It resets automatically — or contact the NSAGPT team to upgrade your plan.`,
    );
  }

  await db.from('ai_usage_events').insert({ user_id: context.userId, feature });
}
