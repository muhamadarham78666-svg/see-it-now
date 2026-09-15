export type SubscriptionPlanKey = 'silver' | 'gold' | 'diamond';

export interface SubscriptionPlan {
  key: SubscriptionPlanKey;
  name: string;
  duration: string;
  price: number;
  priceLabel: string;
  userLimit: number;
  durationDays: number;
  featured?: boolean;
  tagline: string;
  benefits: string[];
  /** Presentation tokens used by the pricing cards. */
  theme: {
    ring: string;
    glow: string;
    badge: string;
    title: string;
    check: string;
    button: string;
  };
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    key: 'silver',
    name: 'Silver',
    duration: 'Weekly',
    price: 399,
    priceLabel: 'Rs. 399',
    userLimit: 1,
    durationDays: 7,
    tagline: 'Try everything for a week',
    benefits: [
      'AI question paper generator (9th–12th)',
      'AI Notes and Book Solver',
      'MCQs, short and long questions',
      'PDF download and printing',
      'English and Urdu papers',
      'Best for one teacher',
    ],
    theme: {
      ring: 'border-slate-300 dark:border-slate-700 hover:border-slate-400',
      glow: 'from-slate-300/40 to-slate-500/20',
      badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
      title: 'text-slate-700 dark:text-slate-200',
      check: 'text-slate-500 dark:text-slate-400',
      button: 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white',
    },
  },
  {
    key: 'gold',
    name: 'Gold',
    duration: '3 Months',
    price: 4999,
    priceLabel: 'Rs. 4,999',
    userLimit: 3,
    durationDays: 90,
    featured: true,
    tagline: 'Best value for a school department',
    benefits: [
      'Everything in Silver',
      'Up to 3 teachers on one plan',
      'All paper templates and board patterns',
      'Full Urdu papers with correct numbering',
      'Unlimited chapters and question bank',
      'Priority support from the NSAGPT team',
    ],
    theme: {
      ring: 'border-amber-400 dark:border-amber-500/70',
      glow: 'from-amber-300/50 to-orange-500/25',
      badge: 'bg-amber-500 text-white',
      title: 'text-amber-600 dark:text-amber-400',
      check: 'text-amber-500',
      button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
    },
  },
  {
    key: 'diamond',
    name: 'Diamond',
    duration: '1 Year',
    price: 10500,
    priceLabel: 'Rs. 10,500',
    userLimit: 5,
    durationDays: 365,
    tagline: 'Lowest monthly cost, full academic year',
    benefits: [
      'Everything in Gold',
      'Up to 5 teachers on one plan',
      'Covers the complete academic year',
      'Lowest cost per month',
      'Fastest support and setup help',
      'New features included as they arrive',
    ],
    theme: {
      ring: 'border-cyan-400 dark:border-cyan-500/70',
      glow: 'from-cyan-300/50 to-violet-500/30',
      badge: 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white',
      title: 'text-cyan-600 dark:text-cyan-300',
      check: 'text-cyan-500',
      button: 'bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white',
    },
  },
];

export function getSubscriptionPlan(key: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.key === key);
}
