/** Shared shapes + browser-side readers for owner-controlled site content. */
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/subscriptions';

export interface SiteSettings {
  contact_address: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  contact_map_url: string;
  show_contact: boolean;
  announcement: string;
  announcement_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  free_trial_enabled: boolean;
  free_trial_days: number;
  signups_paused: boolean;
  blog_enabled: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  contact_address: '',
  contact_phone: '',
  contact_whatsapp: '',
  contact_email: '',
  contact_map_url: '',
  show_contact: false,
  announcement: '',
  announcement_enabled: false,
  maintenance_mode: false,
  maintenance_message: '',
  free_trial_enabled: false,
  free_trial_days: 3,
  signups_paused: false,
  blog_enabled: true,
};

export interface PlanRow {
  plan_key: string;
  name: string;
  duration: string;
  price: number;
  currency: string;
  duration_days: number;
  user_limit: number;
  tagline: string;
  benefits: string[];
  featured: boolean;
  is_active: boolean;
  sort_order: number;
}

export function formatPrice(currency: string, price: number) {
  return `${currency || 'Rs.'} ${price.toLocaleString('en-US')}`;
}

/** Merges live database plans onto the built-in presentation themes. */
export function mergePlans(rows: PlanRow[] | null | undefined): SubscriptionPlan[] {
  if (!rows || rows.length === 0) return SUBSCRIPTION_PLANS;
  const merged = rows
    .filter((row) => row.is_active)
    .map((row) => {
      const base =
        SUBSCRIPTION_PLANS.find((p) => p.key === row.plan_key) ?? SUBSCRIPTION_PLANS[0]!;
      return {
        ...base,
        key: (row.plan_key as SubscriptionPlan['key']) ?? base.key,
        name: row.name || base.name,
        duration: row.duration || base.duration,
        price: row.price,
        priceLabel: formatPrice(row.currency, row.price),
        userLimit: row.user_limit,
        durationDays: row.duration_days,
        featured: row.featured,
        tagline: row.tagline || base.tagline,
        benefits: Array.isArray(row.benefits) && row.benefits.length > 0 ? row.benefits : base.benefits,
      } satisfies SubscriptionPlan;
    });
  return merged.length > 0 ? merged : SUBSCRIPTION_PLANS;
}

export async function fetchLivePlans(): Promise<SubscriptionPlan[]> {
  const { data } = await supabase
    .from('plan_settings')
    .select('*')
    .order('sort_order', { ascending: true });
  return mergePlans(data as unknown as PlanRow[] | null);
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data } = await supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle();
  return { ...DEFAULT_SITE_SETTINGS, ...((data ?? {}) as Partial<SiteSettings>) };
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}
