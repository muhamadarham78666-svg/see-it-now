DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'subscription_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;
END
$$;