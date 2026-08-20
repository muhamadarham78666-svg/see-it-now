import { useEffect, useState } from 'react';
import { Star, Quote, Plus, Loader2, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Review {
  id: string;
  name: string;
  role: string | null;
  institution: string | null;
  country: string | null;
  rating: number;
  content: string;
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id, name, role, institution, country, rating, content')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(9);
      if (active) {
        setReviews((data as Review[] | null) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="reviews" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4">
            <Star size={14} />
            Loved by educators
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            What teachers say about NSAGPT
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Real feedback from schools, academies and universities in Pakistan and around the world.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400">No reviews published yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((r) => (
              <figure key={r.id} className="glass-card p-6 flex flex-col h-full">
                <Quote size={22} className="text-primary-400 mb-3" />
                <blockquote className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">
                  {r.content}
                </blockquote>
                <div className="flex items-center gap-0.5 mt-4 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < r.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }
                    />
                  ))}
                </div>
                <figcaption className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">{r.name}</span>
                  <span className="block text-slate-500 dark:text-slate-400">
                    {[r.role, r.institution, r.country].filter(Boolean).join(' • ')}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <button onClick={() => setShowForm(true)} className="btn-secondary">
            <Plus size={18} />
            Add your review
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Reviews appear here after administrator approval.
          </p>
        </div>
      </div>

      {showForm && <ReviewFormModal onClose={() => setShowForm(false)} />}
    </section>
  );
}

function ReviewFormModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '',
    role: '',
    institution: '',
    country: '',
    rating: 5,
    content: '',
  });
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.content.trim().length < 10) {
      setStatus('error');
      return;
    }
    setStatus('saving');
    const { error } = await supabase.from('reviews').insert({
      name: form.name.trim(),
      role: form.role.trim() || null,
      institution: form.institution.trim() || null,
      country: form.country.trim() || null,
      rating: form.rating,
      content: form.content.trim(),
      status: 'pending',
    });
    setStatus(error ? 'error' : 'done');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Share your experience
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {status === 'done' ? (
          <div className="p-8 text-center">
            <CheckCircle size={40} className="mx-auto text-success-500 mb-4" />
            <p className="text-slate-700 dark:text-slate-300">
              Thank you! Your review was submitted and will appear after approval.
            </p>
            <button onClick={onClose} className="btn-primary mt-6 mx-auto">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Ayesha Khan" />
              <Field label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} placeholder="Physics Teacher" />
              <Field label="Institution" value={form.institution} onChange={(v) => setForm({ ...form, institution: v })} placeholder="NSA School" />
              <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} placeholder="Pakistan" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rating</label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, rating: i + 1 })}
                    className="p-1"
                    aria-label={`${i + 1} stars`}
                  >
                    <Star
                      size={22}
                      className={i < form.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your review</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="How does NSAGPT help you every day?"
                className="input-field resize-y"
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-error-500">
                Please add your name and at least 10 characters of feedback, then try again.
              </p>
            )}

            <button type="submit" disabled={status === 'saving'} className="btn-primary w-full disabled:opacity-60">
              {status === 'saving' ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Submit review
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}
