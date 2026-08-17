CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  note text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.access_requests TO anon, authenticated;
GRANT ALL ON public.access_requests TO service_role;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_request_access" ON public.access_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');