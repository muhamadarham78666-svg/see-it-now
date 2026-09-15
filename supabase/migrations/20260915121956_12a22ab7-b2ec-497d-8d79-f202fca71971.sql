ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS guest_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS guest_token text;

CREATE INDEX IF NOT EXISTS support_threads_guest_token_idx ON public.support_threads (guest_token);