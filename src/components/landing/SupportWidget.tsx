import { useCallback, useEffect, useRef, useState } from 'react';
import { Headphones, Loader2, Mail, MessageSquare, Phone, Send, User, UserCheck, X } from 'lucide-react';
import {
  escalateGuestSupportFn,
  guestSupportMessagesFn,
  sendGuestSupportMessageFn,
  startGuestSupportFn,
} from '@/lib/guest-support.functions';

const STORE_KEY = 'nsagpt_guest_support';

interface Msg {
  id: string;
  sender: string;
  content: string;
  created_at: string;
}

interface Saved {
  threadId: string;
  token: string;
}

function readSaved(): Saved | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Saved;
    return parsed?.threadId && parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [status, setStatus] = useState<string>('ai');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSaved(readSaved());
    setReady(true);
  }, []);

  const refresh = useCallback(async (s: Saved) => {
    try {
      const res = await guestSupportMessagesFn({ data: s });
      setMessages(res.messages as Msg[]);
      setStatus(res.status);
    } catch {
      window.localStorage.removeItem(STORE_KEY);
      setSaved(null);
    }
  }, []);

  useEffect(() => {
    if (!open || !saved) return;
    void refresh(saved);
    const id = window.setInterval(() => void refresh(saved), 15000);
    return () => window.clearInterval(id);
  }, [open, saved, refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, open]);

  const start = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const phone = form.phone.replace(/[\s()-]/g, '');
    if (
      form.name.trim().length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ||
      !/^\+?\d{7,15}$/.test(phone) ||
      form.message.trim().length < 2
    ) {
      setError('Please enter your name, a valid email, phone/WhatsApp number and your question.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await startGuestSupportFn({
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
        },
      });
      if (!res.ok) {
        setError(res.message);
      } else {
        const next = { threadId: res.threadId, token: res.token };
        window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
        setSaved(next);
        setMessages(res.messages as Msg[]);
        setStatus('ai');
        if (res.error) setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the chat.');
    }
    setBusy(false);
  };

  const send = async () => {
    if (!saved || !input.trim() || busy) return;
    setBusy(true);
    setError('');
    const content = input.trim();
    setInput('');
    try {
      const res = await sendGuestSupportMessageFn({ data: { ...saved, content } });
      if (!res.ok) setError(res.message);
      else {
        setMessages(res.messages as Msg[]);
        if (res.error) setError(res.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Message could not be sent.');
    }
    setBusy(false);
  };

  const escalate = async () => {
    if (!saved || busy) return;
    setBusy(true);
    try {
      const res = await escalateGuestSupportFn({ data: saved });
      setMessages(res.messages as Msg[]);
      setStatus('waiting_human');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach the team.');
    }
    setBusy(false);
  };

  const reset = () => {
    window.localStorage.removeItem(STORE_KEY);
    setSaved(null);
    setMessages([]);
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  if (!ready) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 left-5 z-[70] flex items-center gap-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-600/30 px-4 py-3 text-sm font-semibold transition-transform hover:scale-105"
        aria-label="Support chat"
      >
        {open ? <X size={18} /> : <Headphones size={18} />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Support'}</span>
      </button>

      {open && (
        <div className="fixed bottom-20 left-3 sm:left-5 z-[70] w-[min(94vw,380px)] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
          <div className="px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
            <p className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare size={16} /> NSAGPT Support
            </p>
            <p className="text-[11px] opacity-90">
              {saved
                ? status === 'ai'
                  ? 'AI assistant is helping you'
                  : 'The NSAGPT team is on this conversation'
                : 'Share your details to start the chat'}
            </p>
          </div>

          {!saved ? (
            <form onSubmit={start} className="p-4 space-y-3 overflow-y-auto">
              <GuestField icon={<User size={15} />} placeholder="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <GuestField icon={<Mail size={15} />} type="email" placeholder="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <GuestField icon={<Phone size={15} />} type="tel" placeholder="Phone / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <textarea
                className="input-field resize-y text-sm"
                rows={3}
                maxLength={2000}
                placeholder="How can we help you?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              {error && <p className="text-xs text-error-600 dark:text-error-400">{error}</p>}
              <button disabled={busy} className="btn-primary w-full text-sm disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {busy ? 'Starting...' : 'Start chat'}
              </button>
            </form>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50 dark:bg-slate-950/40">
                {messages.map((m) => (
                  <div key={m.id} className={m.sender === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                        m.sender === 'user'
                          ? 'bg-primary-600 text-white'
                          : m.sender === 'system'
                            ? 'bg-amber-50 dark:bg-amber-900/25 text-amber-800 dark:text-amber-200 text-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m.sender === 'admin' && (
                        <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 mb-1 flex items-center gap-1">
                          <UserCheck size={11} /> NSAGPT Team
                        </p>
                      )}
                      {renderText(m.content)}
                    </div>
                  </div>
                ))}
                {busy && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Working...</p>}
                <div ref={bottomRef} />
              </div>

              {error && <p className="px-3 pb-1 text-xs text-error-600 dark:text-error-400">{error}</p>}

              <div className="p-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-end gap-2">
                  <textarea
                    className="input-field !py-2 text-sm resize-none flex-1"
                    rows={1}
                    maxLength={2000}
                    placeholder="Write your message"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                  />
                  <button onClick={() => void send()} disabled={busy || !input.trim()} className="btn-primary !px-3 !py-2 disabled:opacity-50" aria-label="Send">
                    <Send size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {status === 'ai' ? (
                    <button onClick={() => void escalate()} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                      Talk with NSAGPT Team
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500">Our team will reply here and by email.</span>
                  )}
                  <button onClick={reset} className="text-xs text-slate-400 hover:underline">
                    New chat
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function GuestField({
  icon,
  placeholder,
  type = 'text',
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        required
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field !pl-10 text-sm"
      />
    </div>
  );
}

/** Renders **bold** markers as bold text so AI replies never show raw asterisks. */
function renderText(text: string) {
  const clean = text.replace(/^#{1,6}\s*/gm, '').replace(/`/g, '');
  return clean.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
