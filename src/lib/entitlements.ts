/**
 * Plan entitlements (client-safe).
 *
 * Which features each subscription plan unlocks. The live values come from the
 * owner's "Plans & pricing" panel; these defaults are only the fallback.
 */

export type FeatureKey =
  | 'offline_paper'
  | 'question_bank'
  | 'history'
  | 'notes'
  | 'solver'
  | 'ask'
  | 'ai_paper';

export const ALL_FEATURES: FeatureKey[] = [
  'offline_paper',
  'question_bank',
  'history',
  'notes',
  'solver',
  'ask',
  'ai_paper',
];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  offline_paper: 'Paper Generator (from our question bank)',
  question_bank: 'Question Bank',
  history: 'History of your papers',
  notes: 'AI Notes Generator',
  solver: 'Solver and Book Solver',
  ask: 'NSAGPT AI chat',
  ai_paper: 'AI paper generation from your own material',
};

export const DEFAULT_PLAN_FEATURES: Record<string, FeatureKey[]> = {
  silver: ['offline_paper', 'question_bank'],
  gold: ['offline_paper', 'question_bank', 'history'],
  diamond: ALL_FEATURES,
};

export const DEFAULT_DAILY_LIMIT: Record<string, number> = {
  silver: 5,
  gold: 25,
  diamond: 0, // 0 = unlimited
};

export interface Entitlements {
  staff: boolean;
  planKey: string | null;
  planName: string | null;
  features: FeatureKey[];
  dailyPaperLimit: number;
  papersToday: number;
  /** True when the entitlement lookup failed; UI stays permissive, the server still enforces. */
  unknown?: boolean;
}

/** Staff bypass everything; otherwise the plan decides. */
export function can(ent: Entitlements | null | undefined, feature: FeatureKey): boolean {
  if (!ent) return true; // still loading — don't flash locks
  if (ent.staff || ent.unknown) return true;
  return ent.features.includes(feature);
}

export function papersLeft(ent: Entitlements | null | undefined): number | null {
  if (!ent || ent.staff || ent.unknown) return null;
  if (!ent.dailyPaperLimit) return null;
  return Math.max(ent.dailyPaperLimit - ent.papersToday, 0);
}

/** The cheapest plan that includes a feature — used by the upgrade card. */
export function planForFeature(feature: FeatureKey): 'gold' | 'diamond' {
  return DEFAULT_PLAN_FEATURES['gold']!.includes(feature) ? 'gold' : 'diamond';
}
