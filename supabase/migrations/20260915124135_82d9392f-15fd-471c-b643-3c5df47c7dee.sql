CREATE TABLE public.plan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text NOT NULL UNIQUE,
  name text NOT NULL,
  duration text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'Rs.',
  duration_days integer NOT NULL DEFAULT 30,
  user_limit integer NOT NULL DEFAULT 1,
  tagline text NOT NULL DEFAULT '',
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plan_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_settings TO authenticated;
GRANT ALL ON public.plan_settings TO service_role;
ALTER TABLE public.plan_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_settings_public_read" ON public.plan_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "plan_settings_staff_write" ON public.plan_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER plan_settings_set_updated_at BEFORE UPDATE ON public.plan_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.site_settings (
  id text PRIMARY KEY DEFAULT 'main',
  contact_address text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  contact_whatsapp text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_map_url text NOT NULL DEFAULT '',
  show_contact boolean NOT NULL DEFAULT false,
  announcement text NOT NULL DEFAULT '',
  announcement_enabled boolean NOT NULL DEFAULT false,
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text NOT NULL DEFAULT '',
  free_trial_enabled boolean NOT NULL DEFAULT false,
  free_trial_days integer NOT NULL DEFAULT 3,
  signups_paused boolean NOT NULL DEFAULT false,
  blog_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_settings_staff_write" ON public.site_settings FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.site_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  author_name text NOT NULL DEFAULT 'NSAGPT Team',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_posts_public_read" ON public.blog_posts FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "blog_posts_staff_read" ON public.blog_posts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "blog_posts_staff_write" ON public.blog_posts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX blog_posts_published_idx ON public.blog_posts (status, published_at DESC);

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS warned_stages jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO public.plan_settings (plan_key, name, duration, price, duration_days, user_limit, tagline, benefits, featured, sort_order) VALUES
('silver', 'Silver', 'Weekly', 399, 7, 1, 'Try everything for a week', '["AI question paper generator (9th\u201312th)","AI Notes and Book Solver","MCQs, short and long questions","PDF download and printing","English and Urdu papers","Best for one teacher"]'::jsonb, false, 1),
('gold', 'Gold', '3 Months', 4999, 90, 3, 'Best value for a school department', '["Everything in Silver","Up to 3 teachers on one plan","All paper templates and board patterns","Full Urdu papers with correct numbering","Unlimited chapters and question bank","Priority support from the NSAGPT team"]'::jsonb, true, 2),
('diamond', 'Diamond', '1 Year', 10500, 365, 5, 'Lowest monthly cost, full academic year', '["Everything in Gold","Up to 5 teachers on one plan","Covers the complete academic year","Lowest cost per month","Fastest support and setup help","New features included as they arrive"]'::jsonb, false, 3)
ON CONFLICT (plan_key) DO NOTHING;