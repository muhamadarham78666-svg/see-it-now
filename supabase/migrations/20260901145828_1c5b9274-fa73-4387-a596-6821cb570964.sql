DROP POLICY "Anyone can view active boards" ON public.boards;

CREATE POLICY "Anyone can view active boards"
ON public.boards FOR SELECT
USING (is_active);

CREATE POLICY "Admins can view all boards"
ON public.boards FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;