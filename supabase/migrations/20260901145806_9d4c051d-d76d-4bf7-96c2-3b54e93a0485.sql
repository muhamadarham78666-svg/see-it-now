-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profile board preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS board_code text,
  ADD COLUMN IF NOT EXISTS class_level text;

-- Boards
CREATE TABLE public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  region text NOT NULL DEFAULT 'Other',
  style text NOT NULL DEFAULT 'punjab',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.boards TO anon;
GRANT SELECT ON public.boards TO authenticated;
GRANT ALL ON public.boards TO service_role;

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active boards"
ON public.boards FOR SELECT
USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage boards"
ON public.boards FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_boards_updated_at
BEFORE UPDATE ON public.boards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.boards (code, name, region, style, sort_order) VALUES
  ('bise-lahore', 'BISE Lahore', 'Punjab', 'punjab', 1),
  ('bise-gujranwala', 'BISE Gujranwala', 'Punjab', 'punjab', 2),
  ('bise-rawalpindi', 'BISE Rawalpindi', 'Punjab', 'punjab', 3),
  ('bise-multan', 'BISE Multan', 'Punjab', 'punjab', 4),
  ('bise-faisalabad', 'BISE Faisalabad', 'Punjab', 'punjab', 5),
  ('bise-sargodha', 'BISE Sargodha', 'Punjab', 'punjab', 6),
  ('bise-bahawalpur', 'BISE Bahawalpur', 'Punjab', 'punjab', 7),
  ('bise-dgkhan', 'BISE Dera Ghazi Khan', 'Punjab', 'punjab', 8),
  ('bise-sahiwal', 'BISE Sahiwal', 'Punjab', 'punjab', 9),
  ('bise-karachi', 'BSEK / BIEK Karachi', 'Sindh', 'sindh', 10),
  ('bise-hyderabad', 'BISE Hyderabad', 'Sindh', 'sindh', 11),
  ('bise-sukkur', 'BISE Sukkur', 'Sindh', 'sindh', 12),
  ('bise-larkana', 'BISE Larkana', 'Sindh', 'sindh', 13),
  ('bise-mirpurkhas', 'BISE Mirpurkhas', 'Sindh', 'sindh', 14),
  ('bise-benazirabad', 'BISE Shaheed Benazirabad', 'Sindh', 'sindh', 15),
  ('aku-eb', 'Aga Khan Board (AKU-EB)', 'Sindh', 'akueb', 16),
  ('bise-peshawar', 'BISE Peshawar', 'Khyber Pakhtunkhwa', 'kpk', 17),
  ('bise-mardan', 'BISE Mardan', 'Khyber Pakhtunkhwa', 'kpk', 18),
  ('bise-abbottabad', 'BISE Abbottabad', 'Khyber Pakhtunkhwa', 'kpk', 19),
  ('bise-swat', 'BISE Swat', 'Khyber Pakhtunkhwa', 'kpk', 20),
  ('bise-kohat', 'BISE Kohat', 'Khyber Pakhtunkhwa', 'kpk', 21),
  ('bise-dikhan', 'BISE Dera Ismail Khan', 'Khyber Pakhtunkhwa', 'kpk', 22),
  ('bise-bannu', 'BISE Bannu', 'Khyber Pakhtunkhwa', 'kpk', 23),
  ('bise-malakand', 'BISE Malakand', 'Khyber Pakhtunkhwa', 'kpk', 24),
  ('bise-quetta', 'BISE Quetta', 'Balochistan', 'balochistan', 25),
  ('fbise', 'FBISE (Federal Board)', 'Federal', 'fbise', 26),
  ('bise-ajk', 'BISE Mirpur (AJK)', 'Azad Jammu & Kashmir', 'punjab', 27),
  ('bise-gb', 'BISE Gilgit-Baltistan', 'Gilgit-Baltistan', 'punjab', 28),
  ('cambridge-o', 'Cambridge O Level', 'International', 'cambridge', 29),
  ('cambridge-a', 'Cambridge A Level', 'International', 'cambridge', 30),
  ('cambridge-igcse', 'Cambridge IGCSE', 'International', 'cambridge', 31),
  ('ib', 'International Baccalaureate (IB)', 'International', 'ib', 32),
  ('custom', 'Custom / Other board', 'Other', 'custom', 99);

-- Review moderation for admins
CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reviews"
ON public.reviews FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));