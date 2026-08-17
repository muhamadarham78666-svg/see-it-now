CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  source_text text,
  source_file_name text,
  source_file_type text,
  language text NOT NULL DEFAULT 'english' CHECK (language IN ('english','urdu','mixed')),
  question_type text NOT NULL CHECK (question_type IN ('mcq','short','long','mixed')),
  question_count integer NOT NULL DEFAULT 0 CHECK (question_count >= 0),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard','mixed')),
  mcq_options_count integer,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','analyzing','generating','completed','failed')),
  subject text,
  chapter text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generations_select_own" ON public.generations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "generations_insert_own" ON public.generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "generations_update_own" ON public.generations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "generations_delete_own" ON public.generations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX generations_user_created_idx ON public.generations (user_id, created_at DESC);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  generation_id uuid REFERENCES public.generations(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('mcq','short','long')),
  options jsonb,
  correct_answer text,
  expected_answer text,
  answer_points jsonb,
  explanation text,
  marks integer NOT NULL DEFAULT 1 CHECK (marks > 0),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  topic text,
  language text NOT NULL DEFAULT 'english' CHECK (language IN ('english','urdu','mixed')),
  sort_order integer NOT NULL DEFAULT 0,
  is_saved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select_own" ON public.questions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "questions_insert_own" ON public.questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "questions_update_own" ON public.questions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "questions_delete_own" ON public.questions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX questions_user_created_idx ON public.questions (user_id, created_at DESC);
CREATE INDEX questions_generation_idx ON public.questions (generation_id, sort_order);

CREATE TABLE public.papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  institution_name text,
  subject text,
  class_name text,
  chapter text,
  exam_name text,
  exam_date date,
  exam_time text,
  total_marks integer NOT NULL DEFAULT 100 CHECK (total_marks >= 0),
  instructions text,
  logo_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.papers TO authenticated;
GRANT ALL ON public.papers TO service_role;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "papers_select_own" ON public.papers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "papers_insert_own" ON public.papers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "papers_update_own" ON public.papers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "papers_delete_own" ON public.papers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX papers_user_created_idx ON public.papers (user_id, created_at DESC);

CREATE TABLE public.paper_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  marks integer NOT NULL DEFAULT 1 CHECK (marks > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paper_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paper_questions TO authenticated;
GRANT ALL ON public.paper_questions TO service_role;
ALTER TABLE public.paper_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paper_questions_select_own" ON public.paper_questions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "paper_questions_insert_own" ON public.paper_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.papers p WHERE p.id = paper_id AND p.user_id = auth.uid()) AND EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.user_id = auth.uid()));
CREATE POLICY "paper_questions_update_own" ON public.paper_questions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "paper_questions_delete_own" ON public.paper_questions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX paper_questions_paper_idx ON public.paper_questions (paper_id, sort_order);

CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Note',
  content text NOT NULL DEFAULT '',
  subject text,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_select_own" ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notes_insert_own" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_update_own" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notes_delete_own" ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX notes_user_updated_idx ON public.notes (user_id, is_pinned DESC, updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER generations_set_updated_at BEFORE UPDATE ON public.generations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER questions_set_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER papers_set_updated_at BEFORE UPDATE ON public.papers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER notes_set_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.generations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.papers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;