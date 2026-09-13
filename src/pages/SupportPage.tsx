import { useCallback, useEffect, useRef, useState } from 'react';
import { Headphones, Loader2, MessageSquarePlus, Send, ShieldCheck, UserRound } from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Button } from '@/components/nsa/Button';
import { Badge } from '@/components/nsa/Badge';
import { MessageResponse } from '@/components/ai-elements/message';
import {
  escalateSupportFn,
  mySupportThreadsFn,
  sendSupportMessageFn,
  supportMessagesFn,
} from '@/lib/support.functions';
import { supabase } from '@/integrations/supabase/client';

interface Thread {
  id: string;
  subject: string | null;
  status: string;
  escalated: boolean;
  last_message_at: string;
}

interface Msg {
  id: string;
  sender: string;
  content: string;
  created_at: string;
}

const QUICK = [
  'Meri subscription kab tak active hai?',
  'Paper ka PDF download nahi ho raha.',
  'Naya device approve kaise hota hai?',
  'Urdu paper ka pattern kaise set karun?',
];

const statusLabel = (status: string) =>
  status === 'ai'
    ? 'AI Assistant'
    : status === 'waiting_human'
      ? 'Waiting for team'
      : status === 'human'
        ? 'NSAGPT Team'
        : 'Resolved';

const isRtl = (value: string) => /[\u0600-\u06ff\u0750-\u077f]/.test(value);

export function SupportPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const { threads: rows } = await mySupportThreadsFn();
      setThreads(rows as Thread[]);
      return rows as Thread[];
    } catch {
      return [];
    }
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    try {
      const { messages: rows } = await supportMessagesFn({ data: { threadId } });
      setMessages(rows as Msg[]);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    void loadThreads().then((rows) => {
      if (rows.length && rows[0]) {
        setActiveId(rows[0].id);
        void loadMessages(rows[0].id);
      }
    });
  }, [loadThreads, loadMessages]);

  // Live updates when the team replies.
  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`support-${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `thread_id=eq.${activeId}` },
        () => void loadMessages(activeId),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeId, loadMessages]);

  useEffect(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, [messages]);

  const activeThread = threads.find((t) => t.id === activeId) ?? null;

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, sender: 'user', content, created_at: new Date().toISOString() },
    ]);

    try {
      const res = await sendSupportMessageFn({ data: { threadId: activeId, content } });
      setActiveId(res.threadId as string);
      await loadMessages(res.threadId as string);
      await loadThreads();
      if ('error' in res && res.error) setError(res.error as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const escalate = async () => {
    if (!activeId || escalating) return;
    setEscalating(true);
    try {
      await escalateSupportFn({ data: { threadId: activeId } });
      await loadMessages(activeId);
      await loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the NSAGPT team.');
    } finally {
      setEscalating(false);
    }
  };

  const startNew = () => {
    setActiveId(null);
    setMessages([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Headphones className="w-6 h-6 text-primary-500" /> Support
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ask the NSAGPT assistant first — it answers instantly. Any time you want a person, press
            “Talk with NSAGPT Team”.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={startNew}>
          <MessageSquarePlus className="w-4 h-4" /> New conversation
        </Button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <Card className="p-3 h-fit">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Your conversations
          </p>
          {threads.length === 0 && (
            <p className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">
              No conversations yet.
            </p>
          )}
          <div className="space-y-1">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveId(t.id);
                  void loadMessages(t.id);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition ${
                  t.id === activeId
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="block text-sm truncate">{t.subject || 'Support request'}</span>
                <span className="block text-[11px] text-slate-400">{statusLabel(t.status)}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col overflow-hidden min-h-[60vh]">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700/60">
            <Badge variant={activeThread?.status === 'ai' || !activeThread ? 'primary' : 'success'}>
              {activeThread ? statusLabel(activeThread.status) : 'AI Assistant'}
            </Badge>
            <Button variant="secondary" size="sm" onClick={escalate} disabled={!activeId || escalating}>
              {escalating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Talk with NSAGPT Team
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Write your problem below, or pick one:
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => void send(q)}
                      className="px-3 py-1.5 text-sm rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender !== 'user' && (
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                    {m.sender === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                    ) : (
                      <Headphones className="w-4 h-4 text-primary-600 dark:text-primary-300" />
                    )}
                  </div>
                )}
                <div
                  dir={isRtl(m.content) ? 'rtl' : 'ltr'}
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.sender === 'user'
                      ? 'bg-primary-600 text-white'
                      : m.sender === 'system'
                        ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 italic'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-100'
                  }`}
                >
                  {m.sender === 'user' || m.sender === 'system' ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  ) : (
                    <MessageResponse>{m.content}</MessageResponse>
                  )}
                </div>
                {m.sender === 'user' && (
                  <div className="w-8 h-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <UserRound className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && (
            <p className="px-4 py-2 text-sm text-error-600 dark:text-error-300 bg-error-50 dark:bg-error-900/20">
              {error}
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2 border-t border-slate-200 dark:border-slate-700/60 p-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={2}
              placeholder="Apna masla likhein… (Urdu, Roman Urdu ya English)"
              className="flex-1 resize-none bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none px-2 py-2"
            />
            <Button type="submit" disabled={sending || !input.trim()}>
              <Send className="w-4 h-4" /> Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
