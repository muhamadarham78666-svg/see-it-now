import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Crown, Loader2, Lock, Send, Sparkles } from 'lucide-react';
import { FEATURE_LABELS, planForFeature, type FeatureKey } from '@/lib/entitlements';
import { requestRenewalFn } from '@/lib/renewal.functions';
import { usePlanAccess } from '@/context/EntitlementsContext';
import { useLivePlans } from '@/lib/useLivePlans';

/** Small shining crown shown next to locked menu items and cards. */
export function CrownBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900 shadow-[0_0_10px_rgba(245,158,11,0.75)] ${className}`}
      title="Upgrade to unlock"
    >
      <Crown size={11} strokeWidth={2.5} />
      <span className="absolute inset-0 rounded-full bg-amber-300/60 animate-ping" />
    </span>
  );
}

/** Full-page upgrade card shown instead of a feature the plan does not include. */
export function CrownLock({ feature }: { feature: FeatureKey }) {
  const { entitlements } = usePlanAccess();
  const sendRequest = useServerFn(requestRenewalFn);
  const plans = useLivePlans();
  const suggested = planForFeature(feature);

  const [plan, setPlan] = useState<'silver' | 'gold' | 'diamond'>(suggested);
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
      const res = await sendRequest({
        data: {
          plan,
          phone: phone.trim(),
          message: `Upgrade request for: ${FEATURE_LABELS[feature]}. ${message.trim()}`.trim(),
        },
      });
      if (res.ok) setDone(true);
      else setError(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the request.');
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/60 dark:border-amber-500/30 bg-white dark:bg-slate-900 shadow-xl">
        <div className="relative bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-6 py-7 text-white">
          <span className="pointer-events-none absolute -top-10 -left-16 h-40 w-40 rotate-12 bg-white/25 blur-2xl animate-pulse" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner">
              <Crown size={24} />
            </span>
            <div>
              <p className="font-display text-xl font-semibold">{FEATURE_LABELS[feature]}</p>
              <p className="text-sm text-white/90">
                Locked on your {entitlements?.planName ?? 'current'} plan — unlock it with{' '}
                {suggested === 'gold' ? 'Gold' : 'Diamond'}.
              </p>
            </div>
          </div>
        </div>

        {done ? (
          <div className="p-6 text-center space-y-2">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50 dark:bg-success-900/25 text-success-600">
              <Sparkles size={22} />
            </span>
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">Request sent</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              The NSAGPT team will contact you and upgrade your account shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Lock size={15} className="mt-0.5 shrink-0 text-amber-500" />
              Choose the plan you want and leave your number — we activate upgrades manually, no card needed.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {plans.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setPlan(option.key)}
                  className={`relative rounded-xl border px-3 py-2.5 text-left transition-all ${
                    plan === option.key
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 shadow-sm scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{option.name}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">{option.duration}</span>
                  <span className="block text-xs font-medium text-amber-600 dark:text-amber-400">
                    {option.priceLabel}
                  </span>
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

            <button disabled={busy} className="btn-primary text-sm disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send upgrade request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
