import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const schema = z.object({
  classLevel: z.string().trim().min(1),
  book: z.string().trim().min(1),
  chapters: z.array(z.string().trim()).max(80).default([]),
  counts: z.object({
    mcq: z.number().int().min(0).max(400),
    short: z.number().int().min(0).max(400),
    long: z.number().int().min(0).max(200),
  }),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
  language: z.enum(['english', 'urdu', 'both']).default('english'),
  mcqOptionsCount: z.number().int().min(2).max(6).default(4),
  composition: z.array(z.string().trim().max(40)).max(12).nullable().default(null),
  translation: z.string().trim().max(200).nullable().default(null),
  statements: z.boolean().default(false),
  longParts: z.boolean().default(true),
});

/** Builds a paper from the question bank — no AI, works on every plan. */
export const generateOfflinePaperFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    const { requireActiveSubscription } = await import('./subscription.server');
    await requireActiveSubscription(ctx);
    // Bank papers cost no AI credits, so there is no daily limit on them.
    const { requireFeature, recordPaper } = await import('./entitlements.server');
    await requireFeature(ctx, 'offline_paper');

    const { buildOfflinePaper } = await import('./offlinePaper.server');
    const result = await buildOfflinePaper(ctx, data);

    if (!result.questions.length) {
      throw new Error(
        result.poolSize === 0
          ? 'The question bank has no questions for this book and chapters yet. Please tell the NSAGPT team to add them.'
          : 'No matching questions were found. Try more chapters or a mixed difficulty.',
      );
    }

    await recordPaper(ctx, 'offline_bank', result.usedIds);
    return {
      questions: result.questions,
      shortfalls: result.shortfalls,
      poolSize: result.poolSize,
    };
  });

/** Chapter-wise counts so the paper setup screen can show what the bank holds. */
export const bankCoverageFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ classLevel: z.string().trim().min(1), book: z.string().trim().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as { supabase: any; userId: string };
    const { requireFeature } = await import('./entitlements.server');
    await requireFeature(ctx, 'offline_paper');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: rows } = await (supabaseAdmin as unknown as any)
      .from('bank_questions')
      .select('chapter, question_type')
      .eq('is_active', true)
      .eq('class_level', data.classLevel)
      .eq('book', data.book)
      .limit(5000);

    const map = new Map<string, { mcq: number; short: number; long: number }>();
    for (const row of rows ?? []) {
      const key = row.chapter || '—';
      if (!map.has(key)) map.set(key, { mcq: 0, short: 0, long: 0 });
      const entry = map.get(key)!;
      if (row.question_type === 'mcq') entry.mcq += 1;
      else if (row.question_type === 'short') entry.short += 1;
      else entry.long += 1;
    }
    return {
      total: rows?.length ?? 0,
      chapters: [...map.entries()].map(([chapter, counts]) => ({ chapter, ...counts })),
    };
  });
