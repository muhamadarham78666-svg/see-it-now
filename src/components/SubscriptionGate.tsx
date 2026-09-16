import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { AlertTriangle, CalendarClock, Loader2, LogOut, RefreshCw, Sparkles, X } from 'lucide-react';
import { Spinner } from '@/components/nsa/Feedback';
import { useAuth } from '@/context/AuthContext';
import { mySubscriptionStateFn, requestRenewalFn, type SubscriptionState } from '@/lib/renewal.functions';
import { useLivePlans } from '@/lib/useLivePlans';

/**
 * Keeps the dashboard available only while a plan is active.
 * Staff (owner, admin, editor) are never blocked. Expiring plans see a warning card.
 */
export function SubscriptionGate({ children }: { children: ReactNode }) {
  const loadState = useServerFn(mySubscriptionStateFn);
  const { signOut } = useAuth();
  const [state, setState] = useState<SubscriptionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    try {
      setState(await loadState({ data: {} as never }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not check your plan.');
    }
  }, [loadState]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    // Never lock a teacher out because of a temporary network hiccup.
    return <>{children}</>;
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (state.blocked) {
    return <ExpiredScreen state={state} onSignOut={() => void signOut()} />;
  }

  return (
    <>
      {state.warn && !dismissed && <RenewalBanner state={state} onDismiss={() => setDismissed(true)} />}
      {children}
    </>
  );
}

function RenewalBanner({ state, onDismiss }: { state: SubscriptionState; onDismiss: () => void }) {
  const days = state.daysLeft ?? 0;
  return (
    <div className="relative mx-auto max-w-5xl px-4 pt-4">
      <div className="relative overflow-hidden rounded-2xl border border-amber-300/70 dark:border-amber-500/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/25 dark:to-orange-900/20 px-4 py-3.5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
            <CalendarClock size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              {days <= 1
                ? `Your ${state.planName} plan ends ${days <= 0 ? 'today' : 'tomorrow'}`
                : `Your ${state.planName} plan ends in ${days} days`}
            </p>
            <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
              Request a renewal now so your papers and notes never stop. Our team confirms it for you.
            </p>
          </div>
          <button onClick={onDismiss} className="ml-auto text-amber-700/70 hover:text-amber-900 dark:text-amber-200/70" aria-label="Hide">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExpiredScreen({ state, onSignOut }: { state: SubscriptionState; onSignOut: () => void }) {
  const sendRenewal = useServerFn(requestRenewalFn);
  const [plan, setPlan] = useState<'silver' | 'gold' | 'diamond'>(
    (state.planKey as 'silver' | 'gold' | 'diamond') ?? 'gold',
  );
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) {
      setError('Please add a phone or WhatsApp number so we can reach you.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await sendRenewal({ data: { plan, phone: phone.trim(), message: message.trim() } });
      if (res.ok) setDone(true);
      else setError(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the request.');
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-6 py-5 text-white">
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <AlertTriangle size={18} /> Your subscription has ended
          </p>
          <p className="mt-1 text-sm text-white/85">
            {state.hasPlan
              ? `Your ${state.planName} plan finished${state.endsAt ? ` on ${new Date(state.endsAt).toLocaleDateString()}` : ''}.`
              : 'No active plan is linked to this account yet.'}
          </p>
        </div>

        {done ? (
          <div className="p-6 text-center space-y-3">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/25 text-success-600">
              <Sparkles size={22} />
            </span>
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">Renewal request sent</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              The NSAGPT team will contact you shortly and reactivate your account. You will get a confirmation email too.
            </p>
            <button onClick={onSignOut} className="btn-secondary mx-auto text-sm">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Choose a plan and leave your number — we activate renewals manually, no card needed.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {SUBSCRIPTION_PLANS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setPlan(option.key)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                    plan === option.key
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/25 shadow-sm scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{option.name}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">{option.duration}</span>
                  <span className="block text-xs font-medium text-primary-600 dark:text-primary-400">{option.priceLabel}</span>
                </button>
              ))}
            </div>

            <input
              className="input-field text-sm"
              placeholder="Phone / WhatsApp number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <textarea
              className="input-field text-sm resize-y"
              rows={3}
              maxLength={600}
              placeholder="Anything we should know? (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            {error && <p className="text-sm text-error-600 dark:text-error-400">{error}</p>}

            <div className="flex items-center gap-2">
              <button disabled={busy} className="btn-primary text-sm disabled:opacity-60">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Request renewal
              </button>
              <button type="button" onClick={onSignOut} className="btn-secondary text-sm">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
