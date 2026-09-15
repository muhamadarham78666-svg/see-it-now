import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

/** Public blog reads. Server-side so the article pages render with real metadata. */

async function publicDb() {
  const { createClient } = await import('@supabase/supabase-js');
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY'] ?? '';
  return createClient(process.env['SUPABASE_URL']!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: any, init: any) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) {
          headers.delete('Authorization');
        }
        headers.set('apikey', key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export interface BlogCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  cover_url: string;
  author_name: string;
  published_at: string | null;
}

export const publishedBlogPostsFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await publicDb();
  const { data } = await db
    .from('blog_posts')
    .select('id, slug, title, summary, cover_url, author_name, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(60);
  return (data ?? []) as BlogCard[];
});

export const blogPostFn = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const db = await publicDb();
    const { data: post } = await db
      .from('blog_posts')
      .select('id, slug, title, summary, body, cover_url, author_name, published_at, tags')
      .eq('slug', data.slug)
      .eq('status', 'published')
      .maybeSingle();
    return (post ?? null) as null | (BlogCard & { body: string; tags: string[] });
  });
