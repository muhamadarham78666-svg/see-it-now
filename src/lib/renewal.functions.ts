import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Subscription lifecycle: warnings before expiry, blocking after, renewal requests. */

type Ctx = { supabase: any; userId: string };

const DAY = 24 * 60 * 60 * 1000;
const STAGES = [7, 3, 1, 0] as const;

async function isStaff(context: Ctx) {
  const results = await Promise.all(
    (['owner', 'admin', 'editor'] as const).map((role) =>
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: role }),
    ),
  );
  return results.some((r) => r.data);
}

export interface SubscriptionState {
  hasPlan: boolean;
  staff: boolean;
  planKey: string | null;
  planName: string | null;
  status: 'active' | 'expired' | 'none' | string;
  endsAt: string | null;
  daysLeft: number | null;
  blocked: boolean;
  warn: boolean;
}

/** Reads the caller's subscription and sends any due reminder emails. */
export const mySubscriptionStateFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SubscriptionState> => {
    const ctx = context as Ctx;
    const staff = await isStaff(ctx);
    const { data } = await ctx.supabase
      .from('subscriptions')
      .select('plan_key, status, ends_at, warned_stages')
      .eq('user_id', ctx.userId)
      .maybeSingle();

    if (!data) {
      return {
        hasPlan: false,
        staff,
        planKey: null,
        planName: null,
        status: 'none',
        endsAt: null,
        daysLeft: null,
        blocked: !staff,
        warn: false,
      };
    }

    const endsAt = new Date(data.ends_at).getTime();
    const msLeft = endsAt - Date.now();
    const daysLeft = Math.ceil(msLeft / DAY);
    const expired = data.status !== 'active' || msLeft <= 0;

    if (!expired && daysLeft <= 7) {
      await sendDueReminder(ctx, data, daysLeft);
    }

    const { getSubscriptionPlan } = await import('./subscriptions');
    return {
      hasPlan: true,
      staff,
      planKey: data.plan_key,
      planName: getSubscriptionPlan(data.plan_key)?.name ?? data.plan_key,
      status: expired ? 'expired' : data.status,
      endsAt: data.ends_at,
      daysLeft: expired ? 0 : Math.max(daysLeft, 0),
      blocked: expired && !staff,
      warn: !expired && daysLeft <= 7,
    };
  });

async function sendDueReminder(
  ctx: Ctx,
  row: { plan_key: string; ends_at: string; warned_stages: unknown },
  daysLeft: number,
) {
  const stage = STAGES.find((s) => daysLeft <= s && s <= 7);
  if (stage === undefined) return;
  const sent = Array.isArray(row.warned_stages) ? (row.warned_stages as number[]) : [];
  if (sent.includes(stage)) return;

  try {
    const { data: profile } = await ctx.supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', ctx.userId)
      .maybeSingle();
    if (!profile?.email) return;
    const { sendMail, renewalReminderEmail } = await import('./email.server');
    await sendMail({
      to: profile.email,
      toName: profile.full_name ?? undefined,
      subject:
        daysLeft <= 1
          ? 'Your NSAGPT subscription ends today or tomorrow'
          : `Your NSAGPT subscription ends in ${daysLeft} days`,
      html: renewalReminderEmail({
        name: profile.full_name ?? '',
        plan: row.plan_key,
        daysLeft: Math.max(daysLeft, 0),
        endsAt: new Date(row.ends_at).toLocaleDateString(),
      }),
    });
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await (supabaseAdmin as any)
      .from('subscriptions')
      .update({ warned_stages: [...sent, stage] })
      .eq('user_id', ctx.userId);
  } catch (e) {
    console.error('renewal reminder failed', e);
  }
}

/** A signed-in user whose plan is ending or ended asks the team to renew it. */
export const requestRenewalFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        plan: z.enum(['silver', 'gold', 'diamond']),
        phone: z.string().trim().min(7).max(40),
        message: z.string().trim().max(600).default(''),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const { data: profile } = await ctx.supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', ctx.userId)
      .maybeSingle();
    const email = String(profile?.email ?? '').toLowerCase();
    if (!email) return { ok: false as const, message: 'We could not find your account email.' };

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const client = supabaseAdmin as any;
    const { data: existing } = await client
      .from('subscription_requests')
      .select('id')
      .eq('email', email)
      .in('status', ['new', 'contacted'])
      .limit(1)
      .maybeSingle();
    if (existing) {
      return { ok: false as const, message: 'Your renewal request is already pending. Our team will contact you soon.' };
    }

    const { error } = await client.from('subscription_requests').insert({
      full_name: profile?.full_name || email,
      email,
      phone: data.phone,
      plan_key: data.plan,
      message: `RENEWAL: ${data.message}`.trim(),
      status: 'new',
      linked_user_id: ctx.userId,
    });
    if (error) return { ok: false as const, message: 'Request could not be sent. Please try again.' };

    const { sendMail, ADMIN_EMAIL, adminSubscriptionRequestEmail, subscriptionRequestEmail } = await import('./email.server');
    await sendMail({
      to: ADMIN_EMAIL,
      subject: `Renewal request — ${profile?.full_name || email}`,
      html: adminSubscriptionRequestEmail({
        fullName: profile?.full_name || email,
        email,
        phone: data.phone,
        plan: data.plan,
        message: `Renewal request. ${data.message}`,
      }),
    });
    await sendMail({
      to: email,
      toName: profile?.full_name ?? undefined,
      subject: 'We received your NSAGPT renewal request',
      html: subscriptionRequestEmail(profile?.full_name ?? '', data.plan),
    });
    return { ok: true as const };
  });
