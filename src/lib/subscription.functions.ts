import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const planSchema = z.enum(['silver', 'gold', 'diamond']);

export const sendSubscriptionRequestMailFn = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({
    fullName: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(7).max(40),
    plan: planSchema,
    message: z.string().trim().max(1000).default(''),
  }).parse(input))
  .handler(async ({ data }) => {
    const { sendMail, subscriptionRequestEmail, adminSubscriptionRequestEmail, ADMIN_EMAIL } = await import('./email.server');
    const customer = await sendMail({
      to: data.email,
      toName: data.fullName,
      subject: 'We received your NSAGPT subscription request',
      html: subscriptionRequestEmail(data.fullName, data.plan),
    });
    await sendMail({
      to: ADMIN_EMAIL,
      subject: `New ${data.plan} subscription request — ${data.fullName}`,
      html: adminSubscriptionRequestEmail(data),
    });
    return { ok: customer.ok };
  });

export const getMySubscriptionFn = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('subscriptions')
      .select('plan_key, status, starts_at, ends_at, user_limit')
      .eq('user_id', context.userId)
      .maybeSingle();
    if (error) throw new Error('Could not load subscription.');
    if (!data) return null;
    return {
      ...data,
      status: data.status === 'active' && new Date(data.ends_at).getTime() <= Date.now() ? 'expired' : data.status,
    };
  });
