CREATE TABLE public.bank_bulk_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'paused' CHECK (status IN ('running', 'waiting', 'paused', 'completed', 'blocked')),
  class_level text NOT NULL DEFAULT '',
  book text NOT NULL DEFAULT '',
  targets jsonb NOT NULL DEFAULT '{"mcq":60,"short":30,"long":12}'::jsonb,
  progress jsonb NOT NULL DEFAULT '{"chapters":0,"chaptersDone":0,"questions":0,"missing":0}'::jsonb,
  next_retry_at timestamptz,
  lease_until timestamptz,
  last_message text NOT NULL DEFAULT '',
  last_chapter text NOT NULL DEFAULT '',
  consecutive_failures integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.bank_bulk_jobs TO authenticated;
GRANT ALL ON public.bank_bulk_jobs TO service_role;

ALTER TABLE public.bank_bulk_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read bank bulk jobs"
ON public.bank_bulk_jobs
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can create bank bulk jobs"
ON public.bank_bulk_jobs
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Staff can update bank bulk jobs"
ON public.bank_bulk_jobs
FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE UNIQUE INDEX bank_bulk_jobs_one_active_idx
ON public.bank_bulk_jobs ((true))
WHERE status IN ('running', 'waiting');

CREATE INDEX bank_bulk_jobs_status_retry_idx
ON public.bank_bulk_jobs (status, next_retry_at);

CREATE TRIGGER bank_bulk_jobs_set_updated_at
BEFORE UPDATE ON public.bank_bulk_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();