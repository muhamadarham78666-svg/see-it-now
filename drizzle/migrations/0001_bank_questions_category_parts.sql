ALTER TABLE public.bank_questions
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS parts jsonb,
  ADD COLUMN IF NOT EXISTS statement text;

CREATE INDEX IF NOT EXISTS bank_questions_lookup_idx
  ON public.bank_questions (class_level, book, chapter, question_type);

CREATE INDEX IF NOT EXISTS bank_questions_category_idx
  ON public.bank_questions (category);