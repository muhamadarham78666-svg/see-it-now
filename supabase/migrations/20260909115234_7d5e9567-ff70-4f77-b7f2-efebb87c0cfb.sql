ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ui_language text NOT NULL DEFAULT 'en';

CREATE TABLE public.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL DEFAULT '',
  fingerprint text NOT NULL,
  label text NOT NULL DEFAULT 'Unknown device',
  browser text NOT NULL DEFAULT '',
  os text NOT NULL DEFAULT '',
  ip text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, fingerprint)
);

GRANT SELECT ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_devices_select_own ON public.user_devices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY user_devices_admin_all ON public.user_devices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER user_devices_set_updated_at BEFORE UPDATE ON public.user_devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();