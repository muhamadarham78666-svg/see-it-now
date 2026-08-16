import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Keeps a page in sync with the signed-in user's rows in real time.
 * Any insert/update/delete on the given tables (for this user) triggers `onChange`.
 */
export function useRealtimeSync(
  tables: string[],
  userId: string | null | undefined,
  onChange: () => void,
) {
  const handler = useRef(onChange);
  handler.current = onChange;

  const key = tables.join(',');

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`sync:${key}:${userId}`);
    for (const table of key.split(',')) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
        () => handler.current(),
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [key, userId]);
}
