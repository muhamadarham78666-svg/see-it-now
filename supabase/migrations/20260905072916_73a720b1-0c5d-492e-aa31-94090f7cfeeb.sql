ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS diagram_svg text,
  ADD COLUMN IF NOT EXISTS diagram_note text,
  ADD COLUMN IF NOT EXISTS parts jsonb,
  ADD COLUMN IF NOT EXISTS chapter text;