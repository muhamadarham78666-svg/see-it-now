CREATE TABLE public.bank_bulk_scheduler_keys (
  id text PRIMARY KEY DEFAULT 'main',
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.bank_bulk_scheduler_keys TO service_role;

ALTER TABLE public.bank_bulk_scheduler_keys ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.sync_bank_bulk_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
BEGIN
  IF NEW.status IN ('running', 'waiting') THEN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bank-bulk-resume-hourly') THEN
      PERFORM cron.schedule(
        'bank-bulk-resume-hourly',
        '0 * * * *',
        $job$
          SELECT net.http_post(
            url := 'https://nsagpt.org/api/public/bank-bulk-resume',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'x-bank-bulk-secret', (SELECT token FROM public.bank_bulk_scheduler_keys WHERE id = 'main')
            ),
            body := '{}'::jsonb
          );
        $job$
      );
    END IF;
  ELSIF OLD.status IN ('running', 'waiting') THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'bank-bulk-resume-hourly';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bank_bulk_jobs_sync_schedule
AFTER INSERT OR UPDATE OF status ON public.bank_bulk_jobs
FOR EACH ROW EXECUTE FUNCTION public.sync_bank_bulk_schedule();