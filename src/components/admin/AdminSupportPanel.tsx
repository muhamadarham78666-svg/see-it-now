import { useCallback, useEffect, useState } from 'react';
import { Loader2, Send, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Badge } from '@/components/nsa/Badge';
import {
  adminReplySupportFn,
  adminSetSupportStatusFn,
  adminSupportMessagesFn,
  adminSupportThreadsFn,
} from '@/lib/support-admin.functions';
import { supabase } from '@/integrations/supabase/client';

interface Thread {
  id: string;
  subject: string | null;
  status: string;
  escalated: boolean;
  user_name: string | null;
  user_email: string | null;
  plan_key: string | null;
  last_message_at: string;
  subscription: { plan_key: string; status: string; ends_at: string } | null;
}

const STATUSES = ['ai', 'waiting_human', 'human', 'resolved'] as const;

export function AdminSupportPanel({ token }: { token: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    try {
      const { threads: rows } = await adminSupportThreadsFn({ data: { token } });
      setThreads(rows as Thread[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load support conversations.');
    }
  }, [token]);

  const loadMessages = useCallback(
    async (threadId: string) => {
      const { messages: rows } = await adminSupportMessagesFn({ data: { token, threadId } });
      setMessages(rows as any[]);
    },
    [token],
  );

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-support')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        void loadThreads();
        if (activeId) void loadMessages(activeId);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeId, loadThreads, loadMessages]);

  const open = async (id: string) => {
    setActiveId(id);
    setMessages([]);
    try {
      await loadMessages(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open this conversation.');
    }
  };

  const send = async () => {
    if (!activeId || !reply.trim() || busy) return;
    setBusy(true);
    try {
      await adminReplySupportFn({ data: { token, threadId: activeId, content: reply.trim() } });
      setReply('');
      await loadMessages(activeId);
      await loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reply failed.');
    }
    setBusy(false);
  };

  const setStatus = async (status: (typeof STATUSES)[number]) => {
    if (!activeId) return;
    await adminSetSupportStatusFn({ data: { token, threadId: activeId, status } });
    await loadThreads();
  };

  const active = threads.find((t) => t.id === activeId) ?? null;

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-3">
      <Card className="p-0 overflow-hidden">
        <p className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700">
          Conversations ({threads.length})
        </p>
        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[560px] overflow-y-auto">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => void open(t.id)}
              className={`w-full text-left px-4 py-3 ${
                t.id === activeId ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
              }`}
            >
              <p className="text-sm text-slate-800 dark:text-slate-100 truncate">
                {t.user_name || t.user_email || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">{t.subject || 'Support request'}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant={t.status === 'waiting_human' ? 'warning' : t.status === 'resolved' ? 'success' : 'default'}>
                  {t.status}
                </Badge>
                {t.subscription?.status === 'active' && <Badge variant="primary">{t.subscription.plan_key}</Badge>}
              </div>
            </button>
          ))}
          {threads.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No conversations yet.</p>}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden flex flex-col min-h-[560px]">
        {!active ? (
          <p className="p-8 text-center text-sm text-slate-500">Select a conversation to read and reply.</p>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {active.user_name || 'User'} · {active.user_email}
                </p>
                <p className="text-xs text-slate-400">
                  {active.subscription
                    ? `${active.subscription.plan_key} · ${active.subscription.status} · ends ${new Date(active.subscription.ends_at).toLocaleDateString()}`
                    : 'No active subscription'}
                </p>
              </div>
              <div className="flex gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => void setStatus(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs ${
                      active.status === s
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-800 dark:text-slate-100'
                        : m.sender === 'admin'
                          ? 'bg-primary-600 text-white'
                          : m.sender === 'system'
                            ? 'bg-slate-50 dark:bg-slate-800 text-slate-500 italic'
                            : 'bg-accent-50 dark:bg-accent-900/30 text-slate-700 dark:text-slate-100'
                    }`}
                  >
                    <span className="block text-[10px] uppercase tracking-wide opacity-60 mb-1">{m.sender}</span>
                    {m.content}
                  </div>
                </div>
              ))}
              {messages.length === 0 && <p className="text-sm text-slate-500">No messages.</p>}
            </div>

            {error && <p className="px-4 py-2 text-xs text-error-600">{error}</p>}

            <div className="border-t border-slate-100 dark:border-slate-700 p-3 flex items-end gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Reply as the NSAGPT team…"
                className="flex-1 resize-none bg-transparent text-sm text-slate-800 dark:text-slate-100 focus:outline-none px-2 py-2"
              />
              <button
                onClick={() => void send()}
                disabled={busy || !reply.trim()}
                className="btn-primary text-sm py-2 px-4 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export function AdminAuditPanel({ token }: { token: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { adminAuditLogFn } = await import('@/lib/support-admin.functions');
        const { entries: rows } = await adminAuditLogFn({ data: { token } });
        setEntries(rows as any[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load the activity log.');
      }
    })();
  }, [token]);

  return (
    <Card className="p-0 overflow-hidden">
      <p className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700">
        Admin activity log
      </p>
      {error && <p className="p-4 text-sm text-error-600">{error}</p>}
      <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
        {entries.map((e) => (
          <div key={e.id} className="px-4 py-3">
            <p className="text-sm text-slate-800 dark:text-slate-100">
              <span className="font-medium">{e.action}</span>
              {e.target_label ? ` · ${e.target_label}` : ''}
            </p>
            <p className="text-xs text-slate-400">
              {e.actor_email || 'admin'} · {new Date(e.created_at).toLocaleString()}
            </p>
            {e.metadata && Object.keys(e.metadata).length > 0 && (
              <p className="text-xs text-slate-400 mt-1 break-all">{JSON.stringify(e.metadata)}</p>
            )}
          </div>
        ))}
        {entries.length === 0 && !error && (
          <p className="p-6 text-center text-sm text-slate-500">No admin actions recorded yet.</p>
        )}
      </div>
    </Card>
  );
}

export function AdminHealthPanel({ token }: { token: string }) {
  const [checks, setChecks] = useState<{ name: string; status: string; detail: string }[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { adminSystemHealthFn } = await import('@/lib/support-admin.functions');
      const res = await adminSystemHealthFn({ data: { token } });
      setChecks(res.checks);
      setCheckedAt(res.checkedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Health check failed.');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary-500" /> System health
        </p>
        <button onClick={() => void run()} className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          Re-check
        </button>
      </div>
      {loading ? (
        <p className="p-6 text-center text-sm text-slate-500 inline-flex items-center gap-2 w-full justify-center">
          <Loader2 size={15} className="animate-spin" /> Running live checks…
        </p>
      ) : error ? (
        <p className="p-4 text-sm text-error-600">{error}</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {checks.map((c) => (
            <div key={c.name} className="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-100">{c.name}</p>
                <p className="text-xs text-slate-400">{c.detail}</p>
              </div>
              <Badge variant={c.status === 'healthy' ? 'success' : c.status === 'warning' ? 'warning' : 'error'}>
                {c.status}
              </Badge>
            </div>
          ))}
          {checkedAt && (
            <p className="px-4 py-2 text-xs text-slate-400">Checked {new Date(checkedAt).toLocaleTimeString()}</p>
          )}
        </div>
      )}
    </Card>
  );
}
