import { createServerFn } from '@tanstack/react-start';

const FALLBACK_RATE = 279;

/**
 * Live USD → PKR rate for showing approximate international pricing.
 * Public on purpose (no user data) and always returns a usable number.
 */
export const usdPkrRateFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { rates?: Record<string, number> };
    const rate = json.rates?.['PKR'];
    if (typeof rate === 'number' && rate > 50 && rate < 2000) {
      return { rate, live: true as const };
    }
    throw new Error('unexpected rate');
  } catch (err) {
    console.error('[rates] USD→PKR lookup failed', err);
    return { rate: FALLBACK_RATE, live: false as const };
  }
});
