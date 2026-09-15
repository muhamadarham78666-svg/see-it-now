import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Owner/admin controls for plan pricing, site settings and the blog. */

type Ctx = { supabase: any; userId: string };

async function isOwner(context: Ctx) {
  const { data } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'owner' });
  return Boolean(data);
}

async function assertStaff(context: Ctx) {
  const results = await Promise.all(
    (['owner', 'admin', 'editor'] as const).map((role) =>
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: role }),
    ),
  );
  if (!results.some((r) => r.data)) throw new Error('Forbidden');
}

async function assertOwner(context: Ctx) {
  if (!(await isOwner(context))) throw new Error('Only the owner can change this.');
}

async function db() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as any;
}

/* ----------------------------- plans ----------------------------- */

export const adminPlansFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    const { data } = await client.from('plan_settings').select('*').order('sort_order', { ascending: true });
    return { plans: data ?? [], canEdit: await isOwner(context as Ctx) };
  });

const planSchema = z.object({
  plan_key: z.string().trim().min(2).max(40),
  name: z.string().trim().min(1).max(60),
  duration: z.string().trim().min(1).max(60),
  price: z.number().int().min(0).max(10_000_000),
  currency: z.string().trim().min(1).max(8).default('Rs.'),
  duration_days: z.number().int().min(1).max(3650),
  user_limit: z.number().int().min(1).max(1000),
  tagline: z.string().trim().max(200).default(''),
  benefits: z.array(z.string().trim().max(200)).max(20).default([]),
  featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).max(999).default(0),
});

export const adminSavePlanFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => planSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context as Ctx);
    const client = await db();
    const { error } = await client.from('plan_settings').upsert(data, { onConflict: 'plan_key' });
    if (error) throw new Error('Plan could not be saved.');
    return { ok: true as const };
  });

/* --------------------------- settings ---------------------------- */

const settingsSchema = z.object({
  contact_address: z.string().trim().max(300).default(''),
  contact_phone: z.string().trim().max(60).default(''),
  contact_whatsapp: z.string().trim().max(60).default(''),
  contact_email: z.string().trim().max(160).default(''),
  contact_map_url: z.string().trim().max(400).default(''),
  show_contact: z.boolean().default(false),
  announcement: z.string().trim().max(240).default(''),
  announcement_enabled: z.boolean().default(false),
  maintenance_mode: z.boolean().default(false),
  maintenance_message: z.string().trim().max(300).default(''),
  free_trial_enabled: z.boolean().default(false),
  free_trial_days: z.number().int().min(1).max(60).default(3),
  signups_paused: z.boolean().default(false),
  blog_enabled: z.boolean().default(true),
});

export const adminSiteSettingsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    const { data } = await client.from('site_settings').select('*').eq('id', 'main').maybeSingle();
    return { settings: data ?? null, canEdit: await isOwner(context as Ctx) };
  });

export const adminSaveSiteSettingsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertOwner(context as Ctx);
    const client = await db();
    const { error } = await client.from('site_settings').upsert({ id: 'main', ...data }, { onConflict: 'id' });
    if (error) throw new Error('Settings could not be saved.');
    return { ok: true as const };
  });

/* ----------------------------- blog ------------------------------ */

export const adminBlogPostsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    const { data } = await client
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    return data ?? [];
  });

const postSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and dashes.'),
  summary: z.string().trim().max(400).default(''),
  body: z.string().trim().min(1).max(200_000),
  cover_url: z.string().trim().max(600).default(''),
  author_name: z.string().trim().max(120).default('NSAGPT Team'),
  tags: z.array(z.string().trim().max(40)).max(10).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const adminSaveBlogPostFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => postSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    const row: Record<string, unknown> = {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      body: data.body,
      cover_url: data.cover_url,
      author_name: data.author_name || 'NSAGPT Team',
      tags: data.tags,
      status: data.status,
      created_by: (context as Ctx).userId,
      published_at: data.status === 'published' ? new Date().toISOString() : null,
    };
    if (data.id) {
      if (data.status === 'published') {
        const { data: current } = await client.from('blog_posts').select('published_at').eq('id', data.id).maybeSingle();
        if (current?.published_at) row['published_at'] = current.published_at;
      }
      const { error } = await client.from('blog_posts').update(row).eq('id', data.id);
      if (error) throw new Error(error.message.includes('duplicate') ? 'That link name is already used.' : 'Post could not be saved.');
      return { ok: true as const, id: data.id };
    }
    const { data: created, error } = await client.from('blog_posts').insert(row).select('id').maybeSingle();
    if (error) throw new Error(error.message.includes('duplicate') ? 'That link name is already used.' : 'Post could not be saved.');
    return { ok: true as const, id: created?.id as string };
  });

export const adminDeleteBlogPostFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    const { error } = await client.from('blog_posts').delete().eq('id', data.id);
    if (error) throw new Error('Post could not be deleted.');
    return { ok: true as const };
  });
