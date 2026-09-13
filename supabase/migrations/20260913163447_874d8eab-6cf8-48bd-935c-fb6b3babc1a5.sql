ALTER TABLE public.papers
  ADD COLUMN IF NOT EXISTS print_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attempts jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.papers.print_settings IS 'Template and print customization: accent, fonts, density, dividers, logo size, and header alignment.';
COMMENT ON COLUMN public.papers.attempts IS 'Per-section attempt-any counts for mcq, short, and long sections.';