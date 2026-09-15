import { useState } from 'react';
import { Check, Sparkles, Users } from 'lucide-react';
import { SubscriptionRequestModal } from '@/components/landing/SubscriptionRequestModal';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from '@/lib/subscriptions';

export function PricingSection() {
  const [selected, setSelected] = useState<SubscriptionPlanKey | null>(null);
  return (
    <section
      id="pricing"
      className="py-20 sm:py-24 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">SUBSCRIPTIONS</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2">
            Choose your NSAGPT plan
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-3">
            Select a plan and submit your contact details. Our team will contact you and activate it — no online payment.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <article
              key={plan.key}
              className={`group relative rounded-2xl border bg-white dark:bg-slate-900 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl motion-reduce:transform-none ${plan.theme.ring} ${
                plan.featured ? 'md:-mt-3 md:pb-9 shadow-xl' : ''
              }`}
            >
              {/* soft colour glow */}
              <div
                className={`pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br ${plan.theme.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl`}
              />
              {/* shine sweep */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 translate-x-[-120%] group-hover:translate-x-[320%] transition-transform duration-1000 motion-reduce:hidden" />
              </div>

              {plan.featured && (
                <span
                  className={`absolute -top-3 left-5 px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse motion-reduce:animate-none ${plan.theme.badge}`}
                >
                  Most popular
                </span>
              )}

              <div className="relative">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className={plan.theme.check} />
                  <h3 className={`font-display text-2xl font-bold ${plan.theme.title}`}>{plan.name}</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {plan.duration} · {plan.tagline}
                </p>

                <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">
                  {plan.priceLabel}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> / {plan.duration.toLowerCase()}</span>
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <Users size={13} /> Up to {plan.userLimit} {plan.userLimit === 1 ? 'user' : 'users'}
                </div>

                <ul className="mt-6 space-y-2.5">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Check size={16} className={`mt-0.5 flex-shrink-0 ${plan.theme.check}`} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelected(plan.key)}
                  className={`w-full mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all hover:shadow-xl active:scale-[0.98] ${plan.theme.button}`}
                >
                  Select {plan.name}
                </button>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          No online payment is taken. The NSAGPT team will contact you after your request and activate your plan.
        </p>
      </div>

      {selected && <SubscriptionRequestModal planKey={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
