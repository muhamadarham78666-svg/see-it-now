CREATE TABLE public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  plan_key text NOT NULL CHECK (plan_key IN ('silver', 'gold', 'diamond')),
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'approved', 'rejected')),
  linked_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.subscription_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.subscription_requests TO authenticated;
GRANT ALL ON public.subscription_requests TO service_role;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request a subscription"
ON public.subscription_requests FOR INSERT TO anon, authenticated
WITH CHECK (status = 'new' AND linked_user_id IS NULL);
CREATE POLICY "Admins can view subscription requests"
ON public.subscription_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subscription requests"
ON public.subscription_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete subscription requests"
ON public.subscription_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER subscription_requests_set_updated_at
BEFORE UPDATE ON public.subscription_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  request_id uuid UNIQUE REFERENCES public.subscription_requests(id) ON DELETE SET NULL,
  plan_key text NOT NULL CHECK (plan_key IN ('silver', 'gold', 'diamond')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  user_limit integer NOT NULL CHECK (user_limit BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create subscriptions"
ON public.subscriptions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subscriptions"
ON public.subscriptions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete subscriptions"
ON public.subscriptions FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX subscriptions_status_ends_idx ON public.subscriptions(status, ends_at);
CREATE INDEX subscription_requests_status_created_idx ON public.subscription_requests(status, created_at DESC);
CREATE TRIGGER subscriptions_set_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();