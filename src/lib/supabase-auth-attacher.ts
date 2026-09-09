import { createMiddleware } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';

/**
 * Attaches the signed-in user's bearer token to every server function call.
 * Replaces the generated attacher: right after page load (or when the stored
 * session is briefly stale) `getSession()` can resolve to null, which made
 * protected server functions fail with "No authorization header provided".
 * Here we retry and, as a last resort, refresh the session before giving up.
 */
export const attachSupabaseAuthResilient = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    let token: string | undefined;

    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;

      if (!token) {
        // Storage may not be hydrated yet; getUser() waits for it.
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: retry } = await supabase.auth.getSession();
          token = retry.session?.access_token;
        }
      }

      if (!token) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        token = refreshed.session?.access_token;
      }
    } catch {
      token = undefined;
    }

    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
