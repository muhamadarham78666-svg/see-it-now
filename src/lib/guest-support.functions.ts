import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

/**
 * Public support chat for homepage visitors (no account needed).
 * Every call is validated and scoped by a secret per-conversation token,
 * so a visitor can only ever see their own conversation.
 */

async function admin(): Promise<any> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as any;
}

const MAX_MESSAGES_PER_THREAD = 60;

function newToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

async function loadThread(db: any, threadId: string, token: string) {
  const { data } = await db
    .from('support_threads')
    .select('id, status, escalated, guest_name, guest_email, guest_phone, guest_token, subject')
    .eq('id', threadId)
    .maybeSingle();
  if (!data || !data.guest_token || data.guest_token !== token) throw new Error('Forbidden');
  return data;
}

async function history(db: any, threadId: string) {
  const { data } = await db
    .from('support_messages')
    .select('id, sender, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(80);
  return (data ?? []) as { id: string; sender: string; content: string; created_at: string }[];
}

async function aiAnswer(db: any, threadId: string) {
  const rows = await history(db, threadId);
  try {
    const { supportReply } = await import('./support.server');
    const turns = rows.map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: String(m.content),
    }));
    const { reply, needsHuman } = await supportReply(turns);
    await db.from('support_messages').insert({ thread_id: threadId, sender: 'ai', content: reply });
    return { aiReply: reply, needsHuman, error: null as string | null };
  } catch (err) {
    return {
      aiReply: null as string | null,
      needsHuman: true,
      error: err instanceof Error ? err.message : 'Support AI is unavailable.',
    };
  }
}

async function notifyTeam(fields: Record<string, string>, subject: string) {
  try {
    const { sendMail, adminAlertEmail, ADMIN_EMAIL } = await import('./email.server');
    await sendMail({ to: ADMIN_EMAIL, subject, html: adminAlertEmail(fields) });
  } catch (err) {
    console.error('[guest-support] team email failed', err);
  }
}

/** Starts a homepage support conversation after the visitor gives name, email and phone. */
export const startGuestSupportFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        email: z.string().trim().email().max(160),
        phone: z.string().trim().min(7).max(24),
        message: z.string().trim().min(2).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const email = data.email.toLowerCase();

    // Simple abuse guard: max 5 new conversations per email per hour.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await db
      .from('support_threads')
      .select('id', { count: 'exact', head: true })
      .eq('guest_email', email)
      .gte('created_at', since);
    if ((count ?? 0) >= 5) {
      return { ok: false as const, message: 'Too many conversations started. Please try again later.' };
    }

    const token = newToken();
    const { data: created, error } = await db
      .from('support_threads')
      .insert({
        user_id: null,
        subject: data.message.slice(0, 70),
        status: 'ai',
        source: 'homepage',
        guest_name: data.name,
        guest_email: email,
        guest_phone: data.phone,
        guest_token: token,
      })
      .select('id')
      .single();
    if (error || !created) return { ok: false as const, message: 'Could not start the chat. Please try again.' };

    const threadId = created.id as string;
    await db.from('support_messages').insert({ thread_id: threadId, sender: 'user', content: data.message });

    const ai = await aiAnswer(db, threadId);
    await db.from('support_threads').update({ last_message_at: new Date().toISOString() }).eq('id', threadId);
    await notifyTeam(
      { Name: data.name, Email: email, Phone: data.phone, Message: data.message.slice(0, 400) },
      `New NSAGPT website chat — ${data.name}`,
    );

    return {
      ok: true as const,
      threadId,
      token,
      messages: await history(db, threadId),
      needsHuman: ai.needsHuman,
      error: ai.error,
    };
  });

/** Sends a visitor message; the AI answers while the conversation is still with the AI. */
export const sendGuestSupportMessageFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        token: z.string().min(20).max(120),
        content: z.string().trim().min(1).max(2000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const thread = await loadThread(db, data.threadId, data.token);

    const { count } = await db
      .from('support_messages')
      .select('id', { count: 'exact', head: true })
      .eq('thread_id', data.threadId);
    if ((count ?? 0) >= MAX_MESSAGES_PER_THREAD) {
      return { ok: false as const, message: 'This conversation is full. Our team will contact you by email.' };
    }

    await db.from('support_messages').insert({ thread_id: data.threadId, sender: 'user', content: data.content });
    await db.from('support_threads').update({ last_message_at: new Date().toISOString() }).eq('id', data.threadId);

    if (thread.status !== 'ai') {
      await notifyTeam(
        {
          Name: thread.guest_name || '—',
          Email: thread.guest_email || '—',
          Phone: thread.guest_phone || '—',
          Message: data.content.slice(0, 400),
        },
        `New reply in NSAGPT website chat — ${thread.guest_name || thread.guest_email}`,
      );
      return { ok: true as const, messages: await history(db, data.threadId), needsHuman: true, error: null };
    }

    const ai = await aiAnswer(db, data.threadId);
    return { ok: true as const, messages: await history(db, data.threadId), needsHuman: ai.needsHuman, error: ai.error };
  });

/** Polls the conversation so team replies appear for the visitor. */
export const guestSupportMessagesFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({ threadId: z.string().uuid(), token: z.string().min(20).max(120) }).parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const thread = await loadThread(db, data.threadId, data.token);
    return { status: thread.status as string, messages: await history(db, data.threadId) };
  });

/** "Talk with NSAGPT Team" — hands the conversation to a human and emails the team. */
export const escalateGuestSupportFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z.object({ threadId: z.string().uuid(), token: z.string().min(20).max(120) }).parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const thread = await loadThread(db, data.threadId, data.token);

    await db
      .from('support_threads')
      .update({ status: 'waiting_human', escalated: true, last_message_at: new Date().toISOString() })
      .eq('id', data.threadId);
    await db.from('support_messages').insert({
      thread_id: data.threadId,
      sender: 'system',
      content: 'Conversation handed over to the NSAGPT team. A team member will reply here and by email.',
    });

    await notifyTeam(
      {
        Name: thread.guest_name || '—',
        Email: thread.guest_email || '—',
        Phone: thread.guest_phone || '—',
        Subject: thread.subject || '—',
      },
      `NSAGPT website chat escalation — ${thread.guest_name || thread.guest_email}`,
    );

    return { ok: true as const, messages: await history(db, data.threadId) };
  });
