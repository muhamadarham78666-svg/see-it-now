import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const planSchema = z.enum(['silver', 'gold', 'diamond']);

const requestSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(40),
  plan: planSchema,
  message: z.string().trim().max(1000).default(''),
});

export const submitSubscriptionRequestFn = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => requestSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const email = data.email.toLowerCase();
    const { data: existing } = await supabaseAdmin
      .from('subscription_requests')
      .select('id')
      .eq('email', email)
      .eq('plan_key', data.plan)
      .in('status', ['new', 'contacted'])
      .limit(1)
      .maybeSingle();
    if (existing) return { ok: false as const, message: 'Your request is already pending. Our team will contact you soon.' };
    const { error } = await supabaseAdmin.from('subscription_requests').insert({
      full_name: data.fullName,
      email,
      phone: data.phone,
      plan_key: data.plan,
      message: data.message,
      status: 'new',
    });
    if (error) return { ok: false as const, message: 'Request could not be submitted. Please try again.' };
    const { sendMail, subscriptionRequestEmail, adminSubscriptionRequestEmail, ADMIN_EMAIL } = await import('./email.server');
    const customer = await sendMail({
      to: email,
      toName: data.fullName,
      subject: 'We received your NSAGPT subscription request',
      html: subscriptionRequestEmail(data.fullName, data.plan),
    });
    await sendMail({
      to: ADMIN_EMAIL,
      subject: `New ${data.plan} subscription request — ${data.fullName}`,
      html: adminSubscriptionRequestEmail(data),
    });
    return { ok: true as const, emailSent: customer.ok };
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
