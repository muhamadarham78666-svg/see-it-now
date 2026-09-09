import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/lib/rr';
import { useServerFn } from '@tanstack/react-start';
import {
  ArrowLeft,
  BookOpen,
  Check,
  FileText,
  Inbox,
  KeyRound,
  Landmark,
  Loader2,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/nsa/Card';
import { Badge } from '@/components/nsa/Badge';
import { Spinner } from '@/components/nsa/Feedback';
import { ADMIN_TOKEN_KEY, clearAdminToken, getAdminToken } from '@/lib/adminSession';
import {
  adminBoardUpdateFn,
  adminBoardsFn,
  adminContentFn,
  adminCreateUserFn,
  adminDeleteContentFn,
  adminDeleteUserFn,
  adminDeviceActionFn,
  adminDevicesFn,
  adminResetDevicesFn,
  adminOverviewFn,
  adminRequestActionFn,
  adminRequestsFn,
  adminReviewActionFn,
  adminReviewsFn,
  adminUpdateUserFn,
  adminUsersFn,
  checkAdminSessionFn,
  verifyAdminCodeFn,
} from '@/lib/admin.functions';

type Tab = 'overview' | 'users' | 'reviews' | 'requests' | 'devices' | 'boards' | 'content';

interface RequestAccountForm {
  id: string;
  fullName: string;
  email: string;
  password: string;
  makeAdmin: boolean;
}

/** Suggests a readable, strong starter password for a new account. */
function randomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return `${out}#7`;
}


interface Stats {
  users: number;
  papers: number;
  questions: number;
  notes: number;
  reviews: number;
  pendingReviews: number;
  requests: number;
  pendingRequests: number;
  generations: number;
  boards: number;
}

export function AdminPage() {
  const { profile, loading: authLoading } = useAuth();
  const [gate, setGate] = useState<'checking' | 'no-role' | 'code' | 'ready'>('checking');
  const [code, setCode] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [content, setContent] = useState<{ papers: any[]; notes: any[] }>({ papers: [], notes: [] });
  const [newUser, setNewUser] = useState({ email: '', password: '', fullName: '', makeAdmin: false });
  const [showNewUser, setShowNewUser] = useState(false);
  const [reqForm, setReqForm] = useState<RequestAccountForm | null>(null);


  const checkSession = useServerFn(checkAdminSessionFn);
  const verify = useServerFn(verifyAdminCodeFn);
  const getOverview = useServerFn(adminOverviewFn);
  const getUsers = useServerFn(adminUsersFn);
  const getReviews = useServerFn(adminReviewsFn);
  const getRequests = useServerFn(adminRequestsFn);
  const getDevices = useServerFn(adminDevicesFn);
  const deviceAction = useServerFn(adminDeviceActionFn);
  const resetDevices = useServerFn(adminResetDevicesFn);
  const getBoards = useServerFn(adminBoardsFn);
  const getContent = useServerFn(adminContentFn);
  const createUser = useServerFn(adminCreateUserFn);
  const updateUser = useServerFn(adminUpdateUserFn);
  const deleteUser = useServerFn(adminDeleteUserFn);
  const reviewAction = useServerFn(adminReviewActionFn);
  const requestAction = useServerFn(adminRequestActionFn);
  const boardUpdate = useServerFn(adminBoardUpdateFn);
  const deleteContent = useServerFn(adminDeleteContentFn);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      const stored = getAdminToken();
      try {
        const res = await checkSession({ data: { token: stored } });
        if (cancelled) return;
        if (!res.role) {
          setGate('no-role');
          return;
        }
        if (res.verified && stored) {
          setToken(stored);
          setGate('ready');
        } else {
          clearAdminToken();
          setGate('code');
        }
      } catch {
        if (!cancelled) setGate('no-role');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, checkSession]);

  const load = useCallback(
    async (activeTab: Tab, tk: string) => {
      setLoading(true);
      try {
        if (activeTab === 'overview') {
          const res = await getOverview({ data: { token: tk } });
          setStats(res.stats as Stats);
          setRecentUsers(res.recentUsers as any[]);
        } else if (activeTab === 'users') {
          setUsers((await getUsers({ data: { token: tk } })) as any[]);
        } else if (activeTab === 'reviews') {
          setReviews((await getReviews({ data: { token: tk } })) as any[]);
        } else if (activeTab === 'requests') {
          setRequests((await getRequests({ data: { token: tk } })) as any[]);
        } else if (activeTab === 'devices') {
          setDevices((await getDevices({ data: { token: tk } })) as any[]);
        } else if (activeTab === 'boards') {
          setBoards((await getBoards({ data: { token: tk } })) as any[]);
        } else {
          setContent((await getContent({ data: { token: tk } })) as any);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong.';
        if (message.toLowerCase().includes('verification')) {
          clearAdminToken();
          setToken(null);
          setGate('code');
        }
        flash(message);
      }
      setLoading(false);
    },
    [getOverview, getUsers, getReviews, getRequests, getDevices, getBoards, getContent],
  );

  useEffect(() => {
    if (gate === 'ready' && token) void load(tab, token);
  }, [gate, token, tab, load]);

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateBusy(true);
    setGateError(null);
    try {
      const res = await verify({ data: { code } });
      if (!res.ok || !res.token) {
        setGateError('Incorrect verification code.');
        setCode('');
      } else {
        sessionStorage.setItem(ADMIN_TOKEN_KEY, res.token);
        setToken(res.token);
        setGate('ready');
      }
    } catch {
      setGateError('Verification failed.');
    }
    setGateBusy(false);
  };

  if (authLoading || gate === 'checking') {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (gate === 'no-role') {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <ShieldCheck size={40} className="mx-auto text-slate-300 dark:text-slate-600" />
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">Admin access required</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">This area is only available to administrators.</p>
        <Link to="/dashboard" className="btn-primary inline-flex">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </div>
    );
  }

  if (gate === 'code') {
    return (
      <div className="max-w-sm mx-auto py-16">
        <Card className="p-7 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center mx-auto mb-4">
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">Admin verification</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enter your private access code to unlock full control.
          </p>
          <form onSubmit={submitCode} className="mt-5 space-y-3">
            <input
              autoFocus
              inputMode="numeric"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="input-field text-center tracking-[0.6em] text-xl font-semibold"
              autoComplete="one-time-code"
            />
            {gateError && <p className="text-xs text-error-600 dark:text-error-400">{gateError}</p>}
            <button type="submit" disabled={gateBusy || code.length < 4} className="btn-primary w-full disabled:opacity-50">
              {gateBusy ? <Loader2 size={16} className="animate-spin" /> : 'Unlock'}
            </button>
          </form>
        </Card>
      </div>
    );
  }

  const tk = token ?? '';

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: Sparkles },
    { key: 'users', label: 'Users', icon: Users, count: stats?.users },
    { key: 'reviews', label: 'Reviews', icon: MessageSquareQuote, count: stats?.pendingReviews },
    { key: 'requests', label: 'Access requests', icon: Inbox, count: stats?.pendingRequests },
    { key: 'devices', label: 'Devices', icon: ShieldCheck, count: devices.filter((d) => d.status === 'pending').length || undefined },
    { key: 'boards', label: 'Boards', icon: Landmark },
    { key: 'content', label: 'Content', icon: FileText },
  ];

  const searchTerm = query.trim().toLowerCase();
  const filteredUsers = searchTerm
    ? users.filter((u) => `${u.email} ${u.full_name ?? ''}`.toLowerCase().includes(searchTerm))
    : users;

  const act = async (key: string, fn: () => Promise<any>, done?: string) => {
    setBusy(key);
    try {
      const res = await fn();
      if (res && res.ok === false) flash(res.message ?? 'Action failed.');
      else if (done) flash(done);
      if (token) await load(tab, token);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'Action failed.');
    }
    setBusy(null);
  };

  const statCards = stats
    ? [
        { label: 'Users', value: stats.users, icon: Users, tone: 'from-primary-500 to-primary-600' },
        { label: 'Papers', value: stats.papers, icon: FileText, tone: 'from-accent-500 to-accent-600' },
        { label: 'Questions', value: stats.questions, icon: BookOpen, tone: 'from-emerald-500 to-teal-600' },
        { label: 'Notes', value: stats.notes, icon: FileText, tone: 'from-amber-500 to-orange-600' },
        { label: 'AI generations', value: stats.generations, icon: Sparkles, tone: 'from-fuchsia-500 to-purple-600' },
        { label: 'Boards', value: stats.boards, icon: Landmark, tone: 'from-sky-500 to-blue-600' },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-primary-950 to-slate-900 p-6 sm:p-7">
        <div className="absolute -top-16 -right-10 w-56 h-56 bg-primary-500/25 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-medium text-white/80 mb-3">
              <ShieldCheck size={13} /> Verified admin session
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">NSAGPT Control Center</h1>
            <p className="text-sm text-slate-300 mt-1">
              Signed in as {profile?.full_name || profile?.email}. Full control over users, content, reviews and boards.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => token && void load(tab, token)} className="px-3 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 inline-flex items-center gap-2">
              <RefreshCw size={15} /> Refresh
            </button>
            <Link to="/dashboard" className="px-3 py-2 rounded-xl bg-white text-slate-900 text-sm font-medium inline-flex items-center gap-2">
              <ArrowLeft size={15} /> Dashboard
            </Link>
          </div>
        </div>
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
      ) : tab === 'overview' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {statCards.map((s) => (
              <Card key={s.label} className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.tone} flex items-center justify-center text-white`}>
                  <s.icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{s.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Needs your attention</p>
              <button onClick={() => setTab('reviews')} className="w-full flex items-center justify-between py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600">
                <span>Pending reviews</span>
                <Badge variant={stats?.pendingReviews ? 'warning' : 'success'}>{stats?.pendingReviews ?? 0}</Badge>
              </button>
              <button onClick={() => setTab('requests')} className="w-full flex items-center justify-between py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600">
                <span>Pending access requests</span>
                <Badge variant={stats?.pendingRequests ? 'warning' : 'success'}>{stats?.pendingRequests ?? 0}</Badge>
              </button>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Newest users</p>
              <div className="space-y-2">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-semibold">
                      {(u.full_name ?? u.email ?? '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 dark:text-slate-100 truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-slate-400 truncate">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {recentUsers.length === 0 && <p className="text-sm text-slate-400">No users yet.</p>}
              </div>
            </Card>
          </div>
        </div>
      ) : tab === 'users' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users by name or email"
                className="input-field !pl-10"
              />
            </div>
            <button onClick={() => setShowNewUser((v) => !v)} className="btn-primary text-sm">
              <UserPlus size={16} /> New user
            </button>
          </div>

          {showNewUser && (
            <Card className="p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Create an account</p>
              <div className="grid sm:grid-cols-3 gap-2">
                <input placeholder="Full name" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} className="input-field" />
                <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="input-field" />
                <input placeholder="Password (min 8)" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="input-field" />
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={newUser.makeAdmin} onChange={(e) => setNewUser({ ...newUser, makeAdmin: e.target.checked })} className="w-4 h-4 rounded" />
                  Give administrator access
                </label>
                <button
                  disabled={busy === 'create'}
                  onClick={() =>
                    void act('create', async () => {
                      const res = await createUser({ data: { token: tk, ...newUser } });
                      if (res.ok) {
                        setNewUser({ email: '', password: '', fullName: '', makeAdmin: false });
                        setShowNewUser(false);
                      }
                      return res;
                    }, 'User created.')
                  }
                  className="btn-primary text-sm"
                >
                  <Plus size={15} /> Create
                </button>
              </div>
            </Card>
          )}

          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map((u) => (
                <div key={u.id} className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {(u.full_name ?? u.email)[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <input
                      defaultValue={u.full_name ?? ''}
                      placeholder="Full name"
                      onBlur={(e) =>
                        e.target.value !== (u.full_name ?? '') &&
                        void act(`name-${u.id}`, () => updateUser({ data: { token: tk, userId: u.id, fullName: e.target.value } }), 'Name updated.')
                      }
                      className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 border-b border-transparent focus:border-primary-400 outline-none"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="text-xs text-slate-400 min-w-[110px]">
                    <p>{u.papers} papers · {u.notes} notes</p>
                    <p>{u.lastSignIn ? `Last seen ${new Date(u.lastSignIn).toLocaleDateString()}` : 'Never signed in'}</p>
                  </div>
                  <button
                    onClick={() => {
                      const pw = window.prompt(`New password for ${u.email} (min 8 characters)`);
                      if (pw && pw.length >= 8) void act(`pw-${u.id}`, () => updateUser({ data: { token: tk, userId: u.id, password: pw } }), 'Password updated.');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Reset password
                  </button>
                  <button
                    onClick={() => void act(`role-${u.id}`, () => updateUser({ data: { token: tk, userId: u.id, makeAdmin: !u.isAdmin } }), 'Role updated.')}
                    disabled={busy === `role-${u.id}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      u.isAdmin ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {u.isAdmin ? 'Administrator' : 'Make admin'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${u.email}? This removes their account and data.`))
                        void act(`del-${u.id}`, () => deleteUser({ data: { token: tk, userId: u.id } }), 'User deleted.');
                    }}
                    className="p-2 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 hover:bg-error-100"
                    title="Delete user"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {filteredUsers.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No users found.</p>}
            </div>
          </Card>
        </div>
      ) : tab === 'reviews' ? (
        <div className="space-y-3">
          {reviews.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No reviews yet.</Card>}
          {reviews.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>{r.status}</Badge>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {[r.role, r.institution, r.country].filter(Boolean).join(' · ') || '—'}
                  </p>
                  <textarea
                    defaultValue={r.content}
                    rows={2}
                    onBlur={(e) =>
                      e.target.value !== r.content &&
                      void act(`rc-${r.id}`, () => reviewAction({ data: { token: tk, id: r.id, action: r.status === 'approved' ? 'approve' : 'pending', content: e.target.value } }), 'Review updated.')
                    }
                    className="mt-2 w-full text-sm bg-transparent text-slate-600 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-400 rounded-lg p-2 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {busy?.endsWith(r.id) && <Loader2 size={16} className="animate-spin text-slate-400" />}
                  {r.status !== 'approved' && (
                    <button onClick={() => void act(`ap-${r.id}`, () => reviewAction({ data: { token: tk, id: r.id, action: 'approve' } }), 'Approved.')} className="p-2 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400" title="Approve">
                      <Check size={16} />
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button onClick={() => void act(`rj-${r.id}`, () => reviewAction({ data: { token: tk, id: r.id, action: 'reject' } }), 'Rejected.')} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300" title="Reject">
                      <X size={16} />
                    </button>
                  )}
                  <button onClick={() => void act(`dl-${r.id}`, () => reviewAction({ data: { token: tk, id: r.id, action: 'delete' } }), 'Deleted.')} className="p-2 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : tab === 'requests' ? (
        <div className="space-y-3">
          {requests.length === 0 && <Card className="p-8 text-center text-sm text-slate-500">No access requests yet.</Card>}
          {requests.map((r) => (
            <Card key={r.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {[r.first_name, r.last_name].filter(Boolean).join(' ') || r.name || r.email}
                    </p>
                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {r.email}
                    {r.phone ? ` · ${r.phone}` : ''}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-wrap">{r.note ?? ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setReqForm((cur) =>
                        cur?.id === r.id
                          ? null
                          : {
                              id: r.id,
                              fullName: [r.first_name, r.last_name].filter(Boolean).join(' '),
                              email: r.email ?? '',
                              password: randomPassword(),
                              makeAdmin: false,
                            },
                      )
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 inline-flex items-center gap-1"
                  >
                    <UserPlus size={14} /> Create account
                  </button>
                  <button onClick={() => void act(`ra-${r.id}`, () => requestAction({ data: { token: tk, id: r.id, action: 'approve' } }), 'Marked approved.')} className="p-2 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400" title="Approve">
                    <Check size={16} />
                  </button>
                  <button onClick={() => void act(`rr-${r.id}`, () => requestAction({ data: { token: tk, id: r.id, action: 'reject' } }), 'Marked rejected.')} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300" title="Reject">
                    <X size={16} />
                  </button>
                  <button onClick={() => void act(`rd-${r.id}`, () => requestAction({ data: { token: tk, id: r.id, action: 'delete' } }), 'Deleted.')} className="p-2 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {reqForm?.id === r.id && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Create account for this request</p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input placeholder="Full name" value={reqForm?.fullName ?? ""} onChange={(e) => setReqForm((f) => (f ? { ...f, fullName: e.target.value } : f))} className="input-field" />
                    <input placeholder="Email" value={reqForm?.email ?? ""} onChange={(e) => setReqForm((f) => (f ? { ...f, email: e.target.value } : f))} className="input-field" />
                    <div className="flex gap-2">
                      <input placeholder="Password (min 8)" value={reqForm?.password ?? ""} onChange={(e) => setReqForm((f) => (f ? { ...f, password: e.target.value } : f))} className="input-field flex-1" />
                      <button type="button" onClick={() => setReqForm((f) => (f ? { ...f, password: randomPassword() } : f))} className="px-3 rounded-lg text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300" title="New password">
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input type="checkbox" checked={reqForm?.makeAdmin ?? false} onChange={(e) => setReqForm((f) => (f ? { ...f, makeAdmin: e.target.checked } : f))} className="w-4 h-4 rounded" />

                      Give administrator access
                    </label>
                    <button
                      disabled={busy === `rc-${r.id}`}
                      onClick={() =>
                        void act(
                          `rc-${r.id}`,
                          async () => {
                            const form = reqForm;
                            if (!form) return { ok: false, message: 'Form closed.' };
                            if (form.password.length < 8) return { ok: false, message: 'Password must be at least 8 characters.' };
                            const res = await createUser({
                              data: { token: tk, email: form.email, password: form.password, fullName: form.fullName, makeAdmin: form.makeAdmin },
                            });
                            if (!res.ok) return res;
                            await requestAction({ data: { token: tk, id: r.id, action: 'approve' } });
                            setReqForm(null);
                            return res;
                          },
                          'Account created and request approved.',
                        )
                      }
                      className="btn-primary text-sm"
                    >
                      {busy === `rc-${r.id}` ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create & approve
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Share this email and password with the person — they can sign in right away.
                  </p>
                </div>
              )}
            </Card>
          ))}

        </div>
      ) : tab === 'devices' ? (
        <div className="space-y-3">
          <Card className="p-4 text-sm text-slate-600 dark:text-slate-300">
            Each account can be used on one approved device. A new device is blocked at sign-in and appears
            here for approval. Approving a device releases the previous one.
          </Card>
          {devices.length === 0 && (
            <Card className="p-8 text-center text-sm text-slate-500">No devices recorded yet.</Card>
          )}
          {devices.map((d) => (
            <Card key={d.id} className="p-5 flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-900 dark:text-white">{d.label}</p>
                  <Badge variant={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'error' : 'warning'}>
                    {d.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.email || d.user_id}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {[d.browser, d.os, d.ip].filter(Boolean).join(' · ')} ·{' '}
                  {new Date(d.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void act(`da-${d.id}`, () => deviceAction({ data: { token: tk, id: d.id, action: 'approve' } }), 'Device approved.')}
                  className="p-2 rounded-lg bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400"
                  title="Approve device"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => void act(`dr-${d.id}`, () => deviceAction({ data: { token: tk, id: d.id, action: 'reject' } }), 'Device blocked.')}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                  title="Block device"
                >
                  <X size={16} />
                </button>
                <button
                  onClick={() => void act(`dd-${d.id}`, () => deviceAction({ data: { token: tk, id: d.id, action: 'delete' } }), 'Device removed.')}
                  className="p-2 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400"
                  title="Remove device"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => void act(`dz-${d.id}`, () => resetDevices({ data: { token: tk, userId: d.user_id } }), 'All devices cleared for this user.')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Reset user
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : tab === 'boards' ? (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {boards.map((b) => (
              <div key={b.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    defaultValue={b.name}
                    onBlur={(e) => e.target.value !== b.name && void act(`bn-${b.id}`, () => boardUpdate({ data: { token: tk, id: b.id, name: e.target.value } }), 'Board renamed.')}
                    className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 border-b border-transparent focus:border-primary-400 outline-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {b.region} · {b.code}
                  </p>
                </div>
                <button
                  onClick={() => void act(`ba-${b.id}`, () => boardUpdate({ data: { token: tk, id: b.id, isActive: !b.is_active } }), 'Board updated.')}
                  disabled={busy === `ba-${b.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    b.is_active ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                  }`}
                >
                  {b.is_active ? 'Active' : 'Hidden'}
                </button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {([
            { title: 'Recent papers', rows: content.papers, table: 'papers' as const },
            { title: 'Recent notes', rows: content.notes, table: 'notes' as const },
          ]).map((group) => (
            <Card key={group.title} className="p-0 overflow-hidden">
              <p className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700">
                {group.title}
              </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[520px] overflow-y-auto">
                {group.rows.map((row: any) => (
                  <div key={row.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 dark:text-slate-100 truncate">{row.title || 'Untitled'}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {row.owner} · {row.subject ?? '—'} · {new Date(row.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this item permanently?'))
                          void act(`c-${row.id}`, () => deleteContent({ data: { token: tk, table: group.table, id: row.id } }), 'Deleted.');
                      }}
                      className="p-2 rounded-lg bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {group.rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Nothing yet.</p>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
