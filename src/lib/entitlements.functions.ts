import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Entitlements } from './entitlements';

/** What the signed-in user's plan unlocks, for locks and crown badges in the UI. */
export const myEntitlementsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Entitlements> => {
    const { loadEntitlements } = await import('./entitlements.server');
    return loadEntitlements(context as { supabase: any; userId: string });
  });
