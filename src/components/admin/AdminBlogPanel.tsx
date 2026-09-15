import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Eye, EyeOff, FileText, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Spinner } from '@/components/nsa/Feedback';
import { adminBlogPostsFn, adminDeleteBlogPostFn, adminSaveBlogPostFn } from '@/lib/site-admin.functions';
import { slugify } from '@/lib/site';

interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  cover_url: string;
  author_name: string;
  tags: string[];
  status: string;
  published_at: string | null;
}

const BLANK = {
  id: null as string | null,
  title: '',
  slug: '',
  summary: '',
  body: '',
  cover_url: '',
  author_name: 'NSAGPT Team',
  tags: [] as string[],
  status: 'draft' as 'draft' | 'published',
};

/** Write, publish and remove articles that appear on the public blog. */
export function AdminBlogPanel() {
  const listPosts = useServerFn(adminBlogPostsFn);
  const savePost = useServerFn(adminSaveBlogPostFn);
  const removePost = useServerFn(adminDeleteBlogPostFn);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<typeof BLANK | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(((await listPosts({ data: {} as never })) ?? []) as Post[]);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not load posts.');
    }
    setLoading(false);
  }, [listPosts]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (status: 'draft' | 'published') => {
    if (!editing) return;
    setBusy(true);
    setNote(null);
    try {
      await savePost({
        data: {
          ...editing,
          status,
          slug: editing.slug.trim() || slugify(editing.title),
          tags: editing.tags.filter((t) => t.trim().length > 0),
        },
      });
      setEditing(null);
      setNote(status === 'published' ? 'Article is live on the blog.' : 'Draft saved.');
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not save the article.');
    }
    setBusy(false);
  };

  const toggle = async (post: Post) => {
    setBusy(true);
    try {
      await savePost({
        data: {
          id: post.id,
          title: post.title,
          slug: post.slug,
          summary: post.summary ?? '',
          body: post.body,
          cover_url: post.cover_url ?? '',
          author_name: post.author_name ?? 'NSAGPT Team',
          tags: post.tags ?? [],
          status: post.status === 'published' ? 'draft' : 'published',
        },
      });
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not update the article.');
    }
    setBusy(false);
  };

  const destroy = async (post: Post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await removePost({ data: { id: post.id } });
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Could not delete the article.');
    }
    setBusy(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      {note && <p className="text-sm text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-xl px-4 py-3">{note}</p>}

      {!editing ? (
        <>
          <button onClick={() => setEditing({ ...BLANK })} className="btn-primary text-sm">
            <Plus size={16} /> New article
          </button>

          <div className="space-y-2.5">
            {posts.map((post) => (
              <Card key={post.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{post.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    /blog/{post.slug} ·{' '}
                    <span className={post.status === 'published' ? 'text-success-600 dark:text-success-400' : 'text-amber-600 dark:text-amber-400'}>
                      {post.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditing({
                        id: post.id,
                        title: post.title,
                        slug: post.slug,
                        summary: post.summary ?? '',
                        body: post.body,
                        cover_url: post.cover_url ?? '',
                        author_name: post.author_name ?? 'NSAGPT Team',
                        tags: post.tags ?? [],
                        status: post.status === 'published' ? 'published' : 'draft',
                      })
                    }
                    className="btn-secondary !px-3 !py-1.5 text-sm"
                  >
                    <FileText size={14} /> Edit
                  </button>
                  <button onClick={() => void toggle(post)} disabled={busy} className="btn-secondary !px-3 !py-1.5 text-sm disabled:opacity-60">
                    {post.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => void destroy(post)} disabled={busy} className="p-2 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600" aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
            {posts.length === 0 && <p className="text-sm text-slate-500">No articles yet. Create your first one.</p>}
          </div>
        </>
      ) : (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display font-semibold text-slate-900 dark:text-white">
              {editing.id ? 'Edit article' : 'New article'}
            </p>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Title</span>
            <input
              value={editing.title}
              onChange={(e) =>
                setEditing((prev) =>
                  prev
                    ? { ...prev, title: e.target.value, slug: prev.id ? prev.slug : slugify(e.target.value) }
                    : prev,
                )
              }
              className="input-field !py-2 text-sm mt-1"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Link name</span>
              <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="input-field !py-2 text-sm mt-1" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Author</span>
              <input value={editing.author_name} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} className="input-field !py-2 text-sm mt-1" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cover image link (optional)</span>
            <input value={editing.cover_url} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} className="input-field !py-2 text-sm mt-1" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Short summary</span>
            <textarea rows={2} value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} className="input-field text-sm mt-1 resize-y" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Article</span>
            <textarea rows={14} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className="input-field text-sm mt-1 resize-y" />
          </label>

          <div className="flex items-center gap-2">
            <button onClick={() => void submit('draft')} disabled={busy} className="btn-secondary text-sm disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save draft
            </button>
            <button onClick={() => void submit('published')} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} Publish
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
