import { createFileRoute, notFound } from '@tanstack/react-router';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { Link } from '@/lib/rr';
import { blogPostFn } from '@/lib/blog.functions';
import { LandingNav } from '@/components/landing/LandingNav';
import { Footer } from '@/components/landing/Footer';

export const Route = createFileRoute('/blog/$slug')({
  staticData: { sitemap: false },
  loader: async ({ params }) => {
    const post = await blogPostFn({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    const title = loaderData?.title ? `${loaderData.title} — NSAGPT Blog` : 'NSAGPT Blog';
    const description =
      loaderData?.summary?.slice(0, 155) || 'An article from the NSAGPT team for teachers and academies.';
    const image = loaderData?.cover_url?.startsWith('https://') ? loaderData.cover_url : null;
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'article' },
        { name: 'twitter:card', content: 'summary_large_image' },
        ...(image
          ? [
              { property: 'og:image', content: image },
              { name: 'twitter:image', content: image },
            ]
          : []),
      ],
    };
  },
  errorComponent: () => <Shell><p className="text-slate-500">This article could not be loaded.</p></Shell>,
  notFoundComponent: () => (
    <Shell>
      <p className="text-slate-500">This article is not available.</p>
      <Link to="/blog" className="btn-secondary mt-4 text-sm">Back to the blog</Link>
    </Shell>
  ),
  component: BlogPost,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <LandingNav onGetStarted={() => { window.location.href = '/login'; }} />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-28 pb-16">{children}</main>
      <Footer />
    </div>
  );
}

function BlogPost() {
  const post = Route.useLoaderData();

  return (
    <Shell>
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline">
        <ArrowLeft size={14} /> All articles
      </Link>

      <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{post.title}</h1>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <CalendarDays size={13} />
        {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''} · {post.author_name}
      </p>

      {post.cover_url && (
        <img src={post.cover_url} alt={post.title} className="mt-6 w-full rounded-2xl object-cover" />
      )}

      {post.summary && (
        <p className="mt-6 text-lg text-slate-700 dark:text-slate-200 leading-relaxed">{post.summary}</p>
      )}

      <div className="mt-6 space-y-4 text-slate-700 dark:text-slate-300 leading-relaxed">
        {post.body.split(/\n{2,}/).map((block, index) =>
          /^#{1,3}\s/.test(block) ? (
            <h2 key={index} className="font-display text-xl font-semibold text-slate-900 dark:text-white pt-2">
              {block.replace(/^#{1,3}\s*/, '')}
            </h2>
          ) : (
            <p key={index} className="whitespace-pre-wrap">{block}</p>
          ),
        )}
      </div>
    </Shell>
  );
}
