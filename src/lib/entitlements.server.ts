/**
 * Server-side plan entitlements: what the caller's plan unlocks, plus the
 * daily offline-paper counter. Never trust the browser for these checks.
 */
import {
  ALL_FEATURES,
  DEFAULT_DAILY_LIMIT,
  DEFAULT_PLAN_FEATURES,
  FEATURE_LABELS,
  type Entitlements,
  type FeatureKey,
} from './entitlements';

type Ctx = { supabase: any; userId: string };

const DAY = 24 * 60 * 60 * 1000;

async function admin() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as any;
}

async function isStaff(context: Ctx) {
  const results = await Promise.all(
    (['owner', 'admin', 'editor'] as const).map((role) =>
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: role }),
    ),
  );
  return results.some((r: any) => r.data);
}

function cleanFeatures(value: unknown, planKey: string): FeatureKey[] {
  const list = Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  const valid = list.filter((v): v is FeatureKey => (ALL_FEATURES as string[]).includes(v));
  if (valid.length) return valid;
  return DEFAULT_PLAN_FEATURES[planKey] ?? DEFAULT_PLAN_FEATURES['silver']!;
}

export async function loadEntitlements(context: Ctx): Promise<Entitlements> {
  const staff = await isStaff(context);
  const db = await admin();

  const { data: sub } = await db
    .from('subscriptions')
    .select('plan_key, status, ends_at')
    .eq('user_id', context.userId)
    .maybeSingle();

  const active =
    sub && sub.status === 'active' && new Date(sub.ends_at).getTime() > Date.now() ? sub : null;
  const planKey: string | null = active ? String(active.plan_key) : null;

  let features: FeatureKey[] = planKey ? (DEFAULT_PLAN_FEATURES[planKey] ?? []) : [];
  let dailyPaperLimit = planKey ? (DEFAULT_DAILY_LIMIT[planKey] ?? 5) : 0;
  let planName = planKey;

  if (planKey) {
    const { data: plan } = await db
      .from('plan_settings')
      .select('name, features, daily_paper_limit')
      .eq('plan_key', planKey)
      .maybeSingle();
    if (plan) {
      features = cleanFeatures(plan.features, planKey);
      dailyPaperLimit = Number(plan.daily_paper_limit ?? dailyPaperLimit) || 0;
      planName = plan.name || planKey;
    }
  }

  const { count } = await db
    .from('paper_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', context.userId)
    .gte('created_at', new Date(Date.now() - DAY).toISOString());

  return {
    staff,
    planKey,
    planName,
    features: staff ? ALL_FEATURES : features,
    dailyPaperLimit: staff ? 0 : dailyPaperLimit,
    papersToday: count ?? 0,
  };
}

/** Throws a clear, user-facing message when the plan does not include the feature. */
export async function requireFeature(context: Ctx, feature: FeatureKey): Promise<Entitlements> {
  const ent = await loadEntitlements(context);
  if (ent.staff || ent.features.includes(feature)) return ent;
  const label = FEATURE_LABELS[feature];
  throw new Error(
    `${label} is part of the Diamond plan. Your current plan is ${ent.planName ?? 'not active'} — send an upgrade request and the NSAGPT team will activate it.`,
  );
}

/** Enforces the plan's daily paper limit (0 = unlimited). */
export function assertPaperQuota(ent: Entitlements) {
  if (ent.staff || !ent.dailyPaperLimit) return;
  if (ent.papersToday >= ent.dailyPaperLimit) {
    throw new Error(
      `Your plan allows ${ent.dailyPaperLimit} papers per day and today's papers are used up. It resets automatically, or upgrade for more.`,
    );
  }
}

/** Records a generated paper so limits and repeat-avoidance work. */
export async function recordPaper(context: Ctx, source: string, questionIds: string[]) {
  const db = await admin();
  await db
    .from('paper_events')
    .insert({ user_id: context.userId, source, question_ids: questionIds.slice(0, 400) });
}

/** Question ids this user received in their recent papers, so papers stay fresh. */
export async function recentQuestionIds(context: Ctx, days = 14): Promise<Set<string>> {
  const db = await admin();
  const { data } = await db
    .from('paper_events')
    .select('question_ids')
    .eq('user_id', context.userId)
    .gte('created_at', new Date(Date.now() - days * DAY).toISOString())
    .order('created_at', { ascending: false })
    .limit(40);
  const out = new Set<string>();
  for (const row of data ?? []) {
    const ids = Array.isArray(row.question_ids) ? row.question_ids : [];
    for (const id of ids) if (typeof id === 'string') out.add(id);
  }
  return out;
}
