import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/rr';
import {
  ArrowLeft,
  Check,
  Landmark,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/nsa/Card';
import { Badge } from '@/components/nsa/Badge';
import { Spinner } from '@/components/nsa/Feedback';

type Tab = 'reviews' | 'users' | 'boards';

interface ReviewRow {
  id: string;
  name: string;
  role: string | null;
  institution: string | null;
  country: string | null;
  rating: number;
  content: string;
  status: string;
  created_at: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  board_code: string | null;
  class_level: string | null;
  created_at: string;
  isAdmin: boolean;
}

interface BoardRow {
  id: string;
  code: string;
  name: string;
  region: string;
  is_active: boolean;
}

export function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('reviews');
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [boards, setBoards] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const isAdmin = profile?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    const [r, p, roles, b] = await Promise.all([
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, email, full_name, board_code, class_level, created_at'),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('boards').select('id, code, name, region, is_active').order('sort_order'),
    ]);
    setReviews((r.data ?? []) as ReviewRow[]);
    const adminIds = new Set((roles.data ?? []).filter((x) => x.role === 'admin').map((x) => x.user_id));
    setUsers(
      (p.data ?? []).map((u) => ({ ...u, isAdmin: adminIds.has(u.id) })) as UserRow[],
    );
    setBoards((b.data ?? []) as BoardRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <ShieldCheck size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Admin access required
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This area is only available to administrators.
        </p>
        <Link to="/dashboard" className="btn-primary inline-flex">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </div>
    );
  }

  const setReviewStatus = async (id: string, status: string) => {
    setBusy(id);
    await supabase.from('reviews').update({ status }).eq('id', id);
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    setBusy(null);
  };

  const deleteReview = async (id: string) => {
    setBusy(id);
    await supabase.from('reviews').delete().eq('id', id);
    setReviews((rs) => rs.filter((r) => r.id !== id));
    setBusy(null);
  };

  const toggleAdmin = async (user: UserRow) => {
    setBusy(user.id);
    if (user.isAdmin) {
      await supabase.from('user_roles').delete().eq('user_id', user.id).eq('role', 'admin');
    } else {
      await supabase.from('user_roles').insert({ user_id: user.id, role: 'admin' });
    }
    setUsers((us) => us.map((u) => (u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u)));
    setBusy(null);
  };

  const renameUser = async (user: UserRow, full_name: string) => {
    setUsers((us) => us.map((u) => (u.id === user.id ? { ...u, full_name } : u)));
    await supabase.from('profiles').update({ full_name }).eq('id', user.id);
  };

  const toggleBoard = async (board: BoardRow) => {
    setBusy(board.id);
    await supabase.from('boards').update({ is_active: !board.is_active }).eq('id', board.id);
    setBoards((bs) => bs.map((b) => (b.id === board.id ? { ...b, is_active: !b.is_active } : b)));
    setBusy(null);
  };

  const pending = reviews.filter((r) => r.status === 'pending').length;

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: 'reviews', label: 'Reviews', icon: MessageSquareQuote, count: pending },
    { key: 'users', label: 'Users', icon: Users, count: users.length },
    { key: 'boards', label: 'Boards', icon: Landmark, count: boards.filter((b) => b.is_active).length },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary-500" />
            Admin Panel
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage reviews, users and available boards.
          </p>
        </div>
        <button onClick={() => void load()} className="btn-secondary text-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === key
                ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-md shadow-primary-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary-400'
            }`}
          >
            <Icon size={16} />
            {label}
            {typeof count === 'number' && count > 0 && (
              <span className={`text-xs ${tab === key ? 'text-white/80' : 'text-slate-400'}`}>({count})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : tab === 'reviews' ? (
        <div className="space-y-3">
          {reviews.length === 0 && (
            <Card className="p-8 text-center text-sm text-slate-500">No reviews submitted yet.</Card>
          )}
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>
                      {r.status}
                    </Badge>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {[r.role, r.institution, r.country].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">{r.content}</p>
                </div>
                <div className="flex items-center gap-2">
                  {busy === r.id && <Loader2 size={16} className="animate-spin text-slate-400" />}
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => void setReviewStatus(r.id, 'approved')}
                      className="p-2 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 hover:bg-success-100"
                      title="Approve"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => void setReviewStatus(r.id, 'rejected')}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200"
                      title="Reject"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => void deleteReview(r.id)}
                    className="p-2 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 hover:bg-error-100"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : tab === 'users' ? (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex items-center gap-4 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {(u.full_name ?? u.email)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-[180px]">
                  <input
                    defaultValue={u.full_name ?? ''}
                    placeholder="Full name"
                    onBlur={(e) => void renameUser(u, e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 border-b border-transparent focus:border-primary-400 outline-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                </div>
                <span className="text-xs text-slate-400">
                  {u.board_code ?? '—'} {u.class_level ? `· ${u.class_level}` : ''}
                </span>
                <button
                  onClick={() => void toggleAdmin(u)}
                  disabled={busy === u.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    u.isAdmin
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {u.isAdmin ? 'Administrator' : 'Make admin'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {boards.map((b) => (
              <div key={b.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{b.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {b.region} · {b.code}
                  </p>
                </div>
                <button
                  onClick={() => void toggleBoard(b)}
                  disabled={busy === b.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    b.is_active
                      ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {b.is_active ? 'Active' : 'Hidden'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
