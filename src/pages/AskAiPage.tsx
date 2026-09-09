import { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, Sparkles, User } from 'lucide-react';
import { Card } from '@/components/nsa/Card';
import { Button } from '@/components/nsa/Button';
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message';
import { askNsagptFn } from '@/lib/ask.functions';
import { useLanguage } from '@/context/LanguageContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'NSAGPT kya hai aur ye kaise kaam karta hai?',
  'Board pattern ka paper kaise banaun?',
  '9th Physics ka half book test kaise generate karun?',
  'Notes AI se kaise banaye jate hain?',
];

const containsRtlText = (value: string) => /[\u0600-\u06ff\u0750-\u077f]/.test(value);

export function AskAiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { langName } = useLanguage();
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    const next = [...messages, { role: 'user' as const, content: question }];
    setMessages(next);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const { reply } = await askNsagptFn({ data: { messages: next, uiLanguage: langName } });
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'NSAGPT AI could not answer right now.');
    } finally {
      setLoading(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
    }
  };

  const sendRef = useRef(send);
  sendRef.current = send;
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) sendRef.current(q);
  }, []);


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="text-primary-500" size={26} /> NSAGPT AI
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Ask anything — about NSAGPT, papers, syllabus, or any study question. Urdu, Roman Urdu or English.
        </p>
      </div>

      <Card className="p-5 flex flex-col gap-4">
        <div className="min-h-[280px] max-h-[52vh] overflow-y-auto scrollbar-thin space-y-4 pr-1">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className="flex gap-3">
              <div
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white ${
                  m.role === 'user'
                    ? 'bg-slate-400 dark:bg-slate-600'
                    : 'bg-gradient-to-br from-primary-500 to-accent-500'
                }`}
              >
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-1">
                  {m.role === 'user' ? 'You' : 'NSAGPT AI'}
                </p>
                {m.role === 'assistant' ? (
                  <Message from="assistant" className="max-w-full">
                    <MessageContent className="w-full">
                      <MessageResponse
                        dir={containsRtlText(m.content) ? 'rtl' : 'ltr'}
                        className={`nsagpt-ai-response text-slate-700 dark:text-slate-200 ${
                          containsRtlText(m.content) ? 'font-urdu' : ''
                        }`}
                      >
                        {m.content}
                      </MessageResponse>
                    </MessageContent>
                  </Message>
                ) : (
                  <p
                    dir={containsRtlText(m.content) ? 'rtl' : 'ltr'}
                    className={`text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed ${
                      containsRtlText(m.content) ? 'font-urdu' : ''
                    }`}
                  >
                    {m.content}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> NSAGPT AI is thinking…
            </p>
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Apna sawal likhein…"
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send size={16} /> Ask
          </Button>
        </form>
      </Card>
    </div>
  );
}
