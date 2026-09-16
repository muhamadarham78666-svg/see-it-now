import { useState } from 'react';
import { ArrowRight, Check, LogIn, Sparkles, UserPlus, Users, X } from 'lucide-react';
import { SubscriptionRequestModal } from '@/components/landing/SubscriptionRequestModal';
import { type SubscriptionPlanKey } from '@/lib/subscriptions';
import { useLivePlans } from '@/lib/useLivePlans';

/** The first thing a visitor sees after "Get Started": sign in, or pick a plan and request access. */
export function GetStartedModal({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  const livePlans = useLivePlans();
  const [step, setStep] = useState<'choice' | 'plans'>('choice');
  const [plan, setPlan] = useState<SubscriptionPlanKey | null>(null);


  if (plan) {
    return <SubscriptionRequestModal planKey={plan} onClose={onClose} onBack={() => setPlan(null)} />;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Get started"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-primary-500/15 via-accent-500/10 to-transparent pointer-events-none" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 z-10"
          aria-label="Close"
        >
          <X size={19} />
        </button>

        <div className="relative p-6 sm:p-8">
          {step === 'choice' ? (
            <>
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-300">
                  <Sparkles size={13} /> Welcome to NSAGPT
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-3">
                  Do you already have an account?
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Sign in to continue, or choose a plan and we will set your account up for you.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-7">
                <button
                  onClick={onSignIn}
                  className="group text-left rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary-400 hover:shadow-xl transition-all hover:-translate-y-1 motion-reduce:transform-none"
                >
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">
                    <LogIn size={20} />
                  </span>
                  <p className="mt-4 font-semibold text-slate-900 dark:text-white">I already have an account</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sign in and open your dashboard.</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                    Sign in <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button
                  onClick={() => setStep('plans')}
                  className="group text-left rounded-2xl border border-primary-400 dark:border-primary-500/70 p-5 bg-gradient-to-br from-primary-50/60 to-accent-50/40 dark:from-primary-900/20 dark:to-accent-900/10 hover:shadow-xl transition-all hover:-translate-y-1 motion-reduce:transform-none"
                >
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-600 text-white">
                    <UserPlus size={20} />
                  </span>
                  <p className="mt-4 font-semibold text-slate-900 dark:text-white">I'm new here</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Choose a plan, share your details and our team activates your account.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                    Get access <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Choose your plan
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Pick a plan to request. No payment now — our team contacts you to activate it.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mt-6">
                {SUBSCRIPTION_PLANS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setPlan(item.key)}
                    className={`group text-left rounded-2xl border p-4 transition-all hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none ${item.theme.ring}`}
                  >
                    <p className={`font-display text-lg font-bold ${item.theme.title}`}>{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.duration}</p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{item.priceLabel}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Users size={12} /> {item.userLimit} {item.userLimit === 1 ? 'user' : 'users'}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {item.benefits.slice(0, 3).map((benefit) => (
                        <li key={benefit} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Check size={12} className={`mt-0.5 flex-shrink-0 ${item.theme.check}`} />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <span
                      className={`mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${item.theme.button}`}
                    >
                      Select {item.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6">
                <button onClick={() => setStep('choice')} className="text-sm text-slate-500 hover:underline">
                  Back
                </button>
                <button onClick={onSignIn} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                  I already have an account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
