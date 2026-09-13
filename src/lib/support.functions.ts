import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

interface Ctx {
  supabase: any;
  userId: string;
  claims?: { email?: string } | null;
}

const messageInput = z.object({
  threadId: z.string().uuid().nullable().optional(),
  content: z.string().min(2).max(4000),
});

async function admin(): Promise<any> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as any;
}

/** All support conversations of the signed-in user, newest first. */
export const mySupportThreadsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as Ctx;
    const { data, error } = await ctx.supabase
      .from('support_threads')
      .select('id, subject, status, escalated, plan_key, last_message_at, created_at')
      .eq('user_id', ctx.userId)
      .order('last_message_at', { ascending: false })
      .limit(50);
    if (error) throw new Error('Could not load your support conversations.');
    return { threads: data ?? [] };
  });

export const supportMessagesFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ threadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const { data: rows, error } = await ctx.supabase
      .from('support_messages')
      .select('id, sender, content, created_at')
      .eq('thread_id', data.threadId)
      .order('created_at', { ascending: true });
    if (error) throw new Error('Could not load this conversation.');
    return { messages: rows ?? [] };
  });

/** Sends a message. Creates the thread when threadId is null. AI answers while status = 'ai'. */
export const sendSupportMessageFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => messageInput.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const db = await admin();

    const { data: sub } = await db
      .from('subscriptions')
      .select('plan_key, status')
      .eq('user_id', ctx.userId)
      .maybeSingle();

    let threadId = data.threadId ?? null;
    if (!threadId) {
      const { data: created, error } = await db
        .from('support_threads')
        .insert({
          user_id: ctx.userId,
          subject: data.content.slice(0, 70),
          status: 'ai',
          plan_key: sub?.plan_key ?? null,
          source: 'dashboard',
          guest_email: ctx.claims?.email ?? '',
        })
        .select('id')
        .single();
      if (error || !created) throw new Error('Could not start a support conversation.');
      threadId = created.id as string;
    } else {
      const { data: owned } = await db
        .from('support_threads')
        .select('id, user_id')
        .eq('id', threadId)
        .maybeSingle();
      if (!owned || owned.user_id !== ctx.userId) throw new Error('Forbidden');
    }

    await db.from('support_messages').insert({
      thread_id: threadId,
      sender: 'user',
      author_id: ctx.userId,
      content: data.content,
    });
    await db
      .from('support_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', threadId);

    const { data: thread } = await db
      .from('support_threads')
      .select('status')
      .eq('id', threadId)
      .maybeSingle();

    // Human conversation: no AI reply, just notify the team.
    if (thread?.status !== 'ai') {
      return { threadId, aiReply: null as string | null, needsHuman: true };
    }

    const { data: history } = await db
      .from('support_messages')
      .select('sender, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(20);

    try {
      const { enforceAiLimit } = await import('./ai-limits.server');
      await enforceAiLimit(ctx, 'support');
      const { supportReply } = await import('./support.server');
      const turns = (history ?? []).map((m: any) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: String(m.content),
      }));
      const { reply, needsHuman } = await supportReply(turns);
      await db.from('support_messages').insert({
        thread_id: threadId,
        sender: 'ai',
        content: reply,
      });
      return { threadId, aiReply: reply, needsHuman };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Support AI is unavailable.';
      return { threadId, aiReply: null as string | null, needsHuman: true, error: message };
    }
  });

/** "Talk with NSAGPT Team" — hands the conversation to a human and emails the team. */
export const escalateSupportFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ threadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const db = await admin();
    const { data: thread } = await db
      .from('support_threads')
      .select('id, user_id, subject, plan_key')
      .eq('id', data.threadId)
      .maybeSingle();
    if (!thread || thread.user_id !== ctx.userId) throw new Error('Forbidden');

    await db
      .from('support_threads')
      .update({ status: 'waiting_human', escalated: true, last_message_at: new Date().toISOString() })
      .eq('id', data.threadId);
    await db.from('support_messages').insert({
      thread_id: data.threadId,
      sender: 'system',
      content: 'Conversation handed over to the NSAGPT team. A human will reply here soon.',
    });

    const { data: profile } = await db
      .from('profiles')
      .select('full_name, email')
      .eq('id', ctx.userId)
      .maybeSingle();

    try {
      const { sendMail, adminAlertEmail, ADMIN_EMAIL } = await import('./email.server');
      await sendMail({
        to: ADMIN_EMAIL,
        subject: `NSAGPT support escalation — ${profile?.email ?? 'user'}`,
        html: adminAlertEmail({
          Name: profile?.full_name ?? '—',
          Email: profile?.email ?? '—',
          Plan: thread.plan_key ?? 'No active plan',
          Subject: thread.subject ?? '—',
        }),
      });
    } catch (err) {
      console.error('[support] escalation email failed', err);
    }

    await db.from('notifications').insert({
      user_id: ctx.userId,
      kind: 'support',
      title: 'Support request sent to the NSAGPT team',
      body: 'A team member will reply in your support conversation soon.',
    });

    return { ok: true as const };
  });
