import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

interface Ctx {
  supabase: any;
  userId: string;
  claims?: { email?: string } | null;
}

async function assertStaff(context: Ctx, token: string) {
  const roles = await Promise.all(
    (['owner', 'admin', 'editor'] as const).map((role) =>
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: role }),
    ),
  );
  if (!roles.some((r) => r.data)) throw new Error('Forbidden');
  const { verifyAdminToken } = await import('./admin.server');
  if (!verifyAdminToken(token, context.userId)) {
    throw new Error('Admin verification expired. Please re-enter your access code.');
  }
}

async function admin(): Promise<any> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as any;
}

const tokenInput = z.object({ token: z.string().min(1) });

export const adminSupportThreadsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx, data.token);
    const db = await admin();
    const { data: threads } = await db
      .from('support_threads')
      .select('id, user_id, subject, status, escalated, plan_key, source, guest_name, guest_email, guest_phone, created_at, last_message_at')
      .order('last_message_at', { ascending: false })
      .limit(200);

    const userIds = Array.from(
      new Set((threads ?? []).map((t: any) => t.user_id).filter(Boolean)),
    );
    const profiles = userIds.length
      ? (await db.from('profiles').select('id, full_name, email').in('id', userIds)).data ?? []
      : [];
    const subs = userIds.length
      ? (await db.from('subscriptions').select('user_id, plan_key, status, ends_at').in('user_id', userIds)).data ?? []
      : [];
    const pMap = new Map<string, any>(profiles.map((p: any) => [p.id, p]));
    const sMap = new Map<string, any>(subs.map((s: any) => [s.user_id, s]));

    return {
      threads: (threads ?? []).map((t: any) => ({
        ...t,
        user_name: pMap.get(t.user_id)?.full_name ?? t.guest_name ?? null,
        user_email: pMap.get(t.user_id)?.email ?? t.guest_email ?? null,
        subscription: sMap.get(t.user_id) ?? null,
      })),
    };
  });

export const adminSupportMessagesFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput.extend({ threadId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx, data.token);
    const db = await admin();
    const { data: messages } = await db
      .from('support_messages')
      .select('id, sender, content, created_at')
      .eq('thread_id', data.threadId)
      .order('created_at', { ascending: true });
    return { messages: messages ?? [] };
  });

export const adminReplySupportFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput
      .extend({
        threadId: z.string().uuid(),
        content: z.string().min(1).max(4000),
        sendEmail: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    await assertStaff(ctx, data.token);
    const db = await admin();

    await db.from('support_messages').insert({
      thread_id: data.threadId,
      sender: 'admin',
      author_id: ctx.userId,
      content: data.content,
    });
    await db
      .from('support_threads')
      .update({ status: 'human', escalated: true, last_message_at: new Date().toISOString() })
      .eq('id', data.threadId);

    const { data: thread } = await db
      .from('support_threads')
      .select('user_id, guest_name, guest_email, subject')
      .eq('id', data.threadId)
      .maybeSingle();
    let emailed = false;
    if (data.sendEmail) {
      let to = thread?.guest_email ?? '';
      let toName = thread?.guest_name ?? '';
      if (thread?.user_id) {
        const { data: profile } = await db
          .from('profiles')
          .select('full_name, email')
          .eq('id', thread.user_id)
          .maybeSingle();
        to = profile?.email ?? to;
        toName = profile?.full_name ?? toName;
      }
      if (to) {
        try {
          const { sendMail, supportReplyEmail } = await import('./email.server');
          const mail = await sendMail({
            to,
            toName: toName || undefined,
            subject: 'NSAGPT Support — reply from our team',
            html: supportReplyEmail(toName || 'there', data.content),
          });
          emailed = mail.ok;
        } catch (err) {
          console.error('[support] reply email failed', err);
        }
      }
    }
    if (thread?.user_id) {
      await db.from('notifications').insert({
        user_id: thread.user_id,
        kind: 'support',
        title: 'NSAGPT team replied to your support request',
        body: data.content.slice(0, 160),
      });
    }

    const { logAdminAction } = await import('./audit.server');
    await logAdminAction({
      actorId: ctx.userId,
      actorEmail: ctx.claims?.email ?? '',
      action: 'support.reply',
      targetType: 'support_thread',
      targetId: data.threadId,
    });

    return { ok: true as const, emailed };
  });

export const adminSetSupportStatusFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    tokenInput
      .extend({ threadId: z.string().uuid(), status: z.enum(['ai', 'waiting_human', 'human', 'resolved']) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    await assertStaff(ctx, data.token);
    const db = await admin();
    await db.from('support_threads').update({ status: data.status }).eq('id', data.threadId);
    const { logAdminAction } = await import('./audit.server');
    await logAdminAction({
      actorId: ctx.userId,
      actorEmail: ctx.claims?.email ?? '',
      action: 'support.status',
      targetType: 'support_thread',
      targetId: data.threadId,
      metadata: { status: data.status },
    });
    return { ok: true as const };
  });

/** Audit log listing for the admin dashboard. */
export const adminAuditLogFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx, data.token);
    const db = await admin();
    const { data: rows } = await db
      .from('admin_audit_log')
      .select('id, actor_email, action, target_type, target_id, target_label, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    return { entries: rows ?? [] };
  });

/** Real service health checks for the admin dashboard. */
export const adminSystemHealthFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx, data.token);
    const db = await admin();

    const checks: { name: string; status: 'healthy' | 'warning' | 'error'; detail: string }[] = [];

    // Database
    try {
      const started = Date.now();
      const { error } = await db.from('profiles').select('id', { count: 'exact', head: true });
      if (error) throw error;
      checks.push({ name: 'Database', status: 'healthy', detail: `${Date.now() - started} ms` });
    } catch (err) {
      checks.push({ name: 'Database', status: 'error', detail: (err as Error).message.slice(0, 120) });
    }

    // Authentication
    try {
      const { error } = await db.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) throw error;
      checks.push({ name: 'Authentication', status: 'healthy', detail: 'Reachable' });
    } catch (err) {
      checks.push({ name: 'Authentication', status: 'error', detail: (err as Error).message.slice(0, 120) });
    }

    // AI gateway
    const aiKey = process.env['LOVABLE_API_KEY'];
    if (!aiKey) {
      checks.push({ name: 'AI service', status: 'error', detail: 'Not configured' });
    } else {
      try {
        const res = await fetch('https://ai.gateway.lovable.dev/v1/models', {
          headers: { Authorization: `Bearer ${aiKey}` },
        });
        checks.push({
          name: 'AI service',
          status: res.ok ? 'healthy' : 'warning',
          detail: `HTTP ${res.status}`,
        });
      } catch (err) {
        checks.push({ name: 'AI service', status: 'error', detail: (err as Error).message.slice(0, 120) });
      }
    }

    // Email (Brevo)
    const brevo = process.env['BREVO_API_KEY_DIRECT'];
    if (!brevo) {
      checks.push({ name: 'Email (Brevo)', status: 'error', detail: 'Not configured' });
    } else {
      try {
        const res = await fetch('https://api.brevo.com/v3/account', { headers: { 'api-key': brevo } });
        checks.push({
          name: 'Email (Brevo)',
          status: res.ok ? 'healthy' : 'warning',
          detail: `HTTP ${res.status}`,
        });
      } catch (err) {
        checks.push({ name: 'Email (Brevo)', status: 'error', detail: (err as Error).message.slice(0, 120) });
      }
    }

    // Book processing pipeline
    try {
      const { count: books } = await db.from('textbooks').select('id', { count: 'exact', head: true });
      const { count: failed } = await db
        .from('textbooks')
        .select('id', { count: 'exact', head: true })
        .eq('processing_status', 'failed');
      checks.push({
        name: 'Book processing',
        status: (failed ?? 0) > 0 ? 'warning' : 'healthy',
        detail: `${books ?? 0} books, ${failed ?? 0} failed`,
      });
    } catch (err) {
      checks.push({ name: 'Book processing', status: 'error', detail: (err as Error).message.slice(0, 120) });
    }

    return { checks, checkedAt: new Date().toISOString() };
  });
