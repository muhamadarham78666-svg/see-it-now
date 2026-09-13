import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/lib/subscriptions';

const DISMISS_KEY = 'nsagpt.subscriptionPopup.dismissed';

/** Gentle plan reminder that appears once, ten seconds after the first visit. */
export function SubscriptionPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), 10_000);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode — popup simply returns next session */
    }
  };

  const goToPricing = () => {
    close();
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Subscription plans"
      className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-5 animate-in"
    >
      <button
        onClick={close}
        aria-label="Close"
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
        <Sparkles className="w-5 h-5" />
        <p className="font-display font-semibold">Choose your plan</p>
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Pick a plan and our team activates your account manually — no card needed.
      </p>

      <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <li key={plan.key} className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-800 dark:text-slate-100">{plan.name}</span>
            <span>{plan.priceLabel}</span>
          </li>
        ))}
      </ul>

      <button onClick={goToPricing} className="btn-primary mt-4 w-full text-sm py-2">
        See plans
      </button>
    </div>
  );
}
