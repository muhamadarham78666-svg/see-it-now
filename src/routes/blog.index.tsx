import { createFileRoute } from '@tanstack/react-router';
import { Link } from '@/lib/rr';
import { CalendarDays, PenLine } from 'lucide-react';
import { publishedBlogPostsFn } from '@/lib/blog.functions';
import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';

export const Route = createFileRoute('/blog/')({
  staticData: { sitemap: true },
  loader: () => publishedBlogPostsFn(),
  head: () => ({
    meta: [
      { title: 'NSAGPT Blog — Exam Paper & Teaching Guides' },
      {
        name: 'description',
        content:
          'Guides, updates and teaching tips from the NSAGPT team: board paper patterns, AI notes, question banks and classroom workflow ideas.',
      },
      { property: 'og:title', content: 'NSAGPT Blog' },
      { property: 'og:description', content: 'Guides and updates for teachers using NSAGPT.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://nsagpt.org/blog' }],
  }),
  errorComponent: () => <BlogShell><p className="text-slate-500">The blog could not be loaded right now.</p></BlogShell>,
  notFoundComponent: () => <BlogShell><p className="text-slate-500">Nothing here yet.</p></BlogShell>,
  component: BlogIndex,
});

function BlogShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <LandingNav onGetStarted={() => { window.location.href = '/login'; }} />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">{children}</main>
      <Footer />
    </div>
  );
}

function BlogIndex() {
  const posts = Route.useLoaderData();

  return (
    <BlogShell>
      <header className="mb-10">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/25 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
          <PenLine size={13} /> NSAGPT Blog
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          Guides, updates and teaching ideas
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Practical articles from the NSAGPT team on board paper patterns, AI notes and saving time on exam preparation.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">No articles published yet — check back soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              {post.cover_url ? (
                <img src={post.cover_url} alt={post.title} loading="lazy" className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 w-full bg-gradient-to-br from-primary-500/20 to-accent-500/20" />
              )}
              <div className="p-5">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {post.title}
                </h2>
                {post.summary && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{post.summary}</p>
                )}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays size={12} />
                  {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''} · {post.author_name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BlogShell>
  );
}
