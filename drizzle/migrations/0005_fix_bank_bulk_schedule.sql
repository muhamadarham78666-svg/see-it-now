CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE OR REPLACE FUNCTION public.sync_bank_bulk_schedule()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    IF NEW.status IN ('running','waiting') THEN
      IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bank-bulk-resume-hourly') THEN
        PERFORM cron.schedule('bank-bulk-resume-hourly','0 * * * *',
          $job$ SELECT net.http_post(
            url := 'https://nsagpt.org/api/public/bank-bulk-resume',
            headers := jsonb_build_object('Content-Type','application/json',
              'x-bank-bulk-secret',(SELECT token FROM public.bank_bulk_scheduler_keys WHERE id='main')),
            body := '{}'::jsonb); $job$);
      END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.status IN ('running','waiting') THEN
      PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'bank-bulk-resume-hourly';
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'bank bulk schedule sync skipped: %', SQLERRM;
  END;
  RETURN NEW;
END;
$function$;