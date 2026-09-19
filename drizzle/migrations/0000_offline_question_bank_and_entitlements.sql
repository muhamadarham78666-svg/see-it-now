-- Master offline question bank (staff-managed, all users read)
CREATE TABLE public.bank_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'file',
  class_level text NOT NULL DEFAULT '',
  book text NOT NULL DEFAULT '',
  total_rows integer NOT NULL DEFAULT 0,
  inserted_rows integer NOT NULL DEFAULT 0,
  skipped_rows integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'done',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bank_imports TO authenticated;
GRANT ALL ON public.bank_imports TO service_role;
ALTER TABLE public.bank_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read bank imports" ON public.bank_imports FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.bank_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_level text NOT NULL,
  book text NOT NULL,
  chapter text NOT NULL DEFAULT '',
  question_type text NOT NULL,
  question_text text NOT NULL,
  options jsonb,
  correct_answer text,
  expected_answer text,
  answer_points jsonb,
  explanation text NOT NULL DEFAULT '',
  marks integer NOT NULL DEFAULT 1,
  difficulty text NOT NULL DEFAULT 'medium',
  language text NOT NULL DEFAULT 'english',
  topic text NOT NULL DEFAULT '',
  fingerprint text NOT NULL,
  import_id uuid REFERENCES public.bank_imports(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX bank_questions_fingerprint_key ON public.bank_questions (fingerprint);
CREATE INDEX bank_questions_lookup_idx ON public.bank_questions (class_level, book, chapter, question_type, is_active);

GRANT SELECT ON public.bank_questions TO authenticated;
GRANT ALL ON public.bank_questions TO service_role;
ALTER TABLE public.bank_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in users read active bank questions" ON public.bank_questions FOR SELECT TO authenticated USING (is_active OR public.is_staff(auth.uid()));

CREATE TRIGGER bank_questions_set_updated_at BEFORE UPDATE ON public.bank_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Offline paper usage counter (daily limits, repeat avoidance)
CREATE TABLE public.paper_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'offline',
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX paper_events_user_idx ON public.paper_events (user_id, created_at DESC);
GRANT SELECT ON public.paper_events TO authenticated;
GRANT ALL ON public.paper_events TO service_role;
ALTER TABLE public.paper_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own paper events" ON public.paper_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Plan entitlements (editable from the admin Plans panel)
ALTER TABLE public.plan_settings ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '["offline_paper","question_bank"]'::jsonb;
ALTER TABLE public.plan_settings ADD COLUMN IF NOT EXISTS daily_paper_limit integer NOT NULL DEFAULT 5;

UPDATE public.plan_settings SET features = '["offline_paper","question_bank"]'::jsonb, daily_paper_limit = 5 WHERE plan_key = 'silver';
UPDATE public.plan_settings SET features = '["offline_paper","question_bank","history"]'::jsonb, daily_paper_limit = 25 WHERE plan_key = 'gold';
UPDATE public.plan_settings SET features = '["offline_paper","question_bank","history","notes","solver","ask","ai_paper"]'::jsonb, daily_paper_limit = 0 WHERE plan_key = 'diamond';