CREATE OR REPLACE FUNCTION public.claim_bank_bulk_job(_job_id uuid, _lease_seconds integer DEFAULT 300)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed boolean;
BEGIN
  UPDATE public.bank_bulk_jobs
  SET lease_until = now() + make_interval(secs => GREATEST(30, LEAST(_lease_seconds, 900)))
  WHERE id = _job_id
    AND status IN ('running', 'waiting')
    AND (next_retry_at IS NULL OR next_retry_at <= now())
    AND (lease_until IS NULL OR lease_until <= now());
  GET DIAGNOSTICS claimed = ROW_COUNT;
  RETURN claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_bank_bulk_job(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_bank_bulk_job(uuid, integer) TO service_role;