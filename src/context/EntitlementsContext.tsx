import { createContext, useContext, type ReactNode } from 'react';
import { useEntitlements } from '@/lib/useEntitlements';
import { can, type Entitlements, type FeatureKey } from '@/lib/entitlements';

interface Ctx {
  entitlements: Entitlements | null;
  refresh: () => Promise<void>;
  allows: (feature: FeatureKey) => boolean;
}

const EntitlementsContext = createContext<Ctx>({
  entitlements: null,
  refresh: async () => {},
  allows: () => true,
});

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { entitlements, refresh } = useEntitlements();
  return (
    <EntitlementsContext.Provider
      value={{ entitlements, refresh, allows: (feature) => can(entitlements, feature) }}
    >
      {children}
    </EntitlementsContext.Provider>
  );
}

export function usePlanAccess() {
  return useContext(EntitlementsContext);
}
