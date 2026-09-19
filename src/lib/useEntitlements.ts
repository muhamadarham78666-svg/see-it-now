import { useCallback, useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { myEntitlementsFn } from '@/lib/entitlements.functions';
import { ALL_FEATURES, type Entitlements } from '@/lib/entitlements';

/** Loads the current user's plan entitlements once per mount. */
export function useEntitlements() {
  const load = useServerFn(myEntitlementsFn);
  const [ent, setEnt] = useState<Entitlements | null>(null);

  const refresh = useCallback(async () => {
    try {
      setEnt(await load({ data: {} as never }));
    } catch {
      // Never lock a teacher out because of a network hiccup — the server still enforces.
      setEnt({
        staff: false,
        planKey: null,
        planName: null,
        features: ALL_FEATURES,
        dailyPaperLimit: 0,
        papersToday: 0,
        unknown: true,
      });
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entitlements: ent, refresh };
}
