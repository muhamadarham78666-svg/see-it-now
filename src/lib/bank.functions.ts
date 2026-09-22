import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/** Owner/admin tools for the offline question bank. */

type Ctx = { supabase: any; userId: string };

async function assertStaff(context: Ctx) {
  const results = await Promise.all(
    (['owner', 'admin', 'editor'] as const).map((role) =>
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: role }),
    ),
  );
  if (!results.some((r: any) => r.data)) throw new Error('Forbidden');
}

async function db() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as any;
}

/* ------------------------------ read ------------------------------ */

export const bankOverviewFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    const { data: rows } = await client
      .from('bank_questions')
      .select('class_level, book, question_type, is_active')
      .limit(20000);

    const groups = new Map<string, { class_level: string; book: string; mcq: number; short: number; long: number; total: number }>();
    for (const row of rows ?? []) {
      if (row.is_active === false) continue;
      const key = `${row.class_level}||${row.book}`;
      if (!groups.has(key))
        groups.set(key, { class_level: row.class_level, book: row.book, mcq: 0, short: 0, long: 0, total: 0 });
      const entry = groups.get(key)!;
      entry.total += 1;
      if (row.question_type === 'mcq') entry.mcq += 1;
      else if (row.question_type === 'short') entry.short += 1;
      else entry.long += 1;
    }

    const { data: imports } = await client
      .from('bank_imports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      total: (rows ?? []).length,
      books: [...groups.values()].sort((a, b) =>
        `${a.class_level}${a.book}`.localeCompare(`${b.class_level}${b.book}`),
      ),
      imports: imports ?? [],
    };
  });

export const bankQuestionsFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        classLevel: z.string().trim().default(''),
        book: z.string().trim().default(''),
        chapter: z.string().trim().default(''),
        search: z.string().trim().max(120).default(''),
        limit: z.number().int().min(1).max(200).default(60),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    let query = client
      .from('bank_questions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(data.limit);
    if (data.classLevel) query = query.eq('class_level', data.classLevel);
    if (data.book) query = query.eq('book', data.book);
    if (data.chapter) query = query.eq('chapter', data.chapter);
    if (data.search) query = query.ilike('question_text', `%${data.search}%`);
    const { data: rows } = await query;
    return { questions: rows ?? [] };
  });

/* ----------------------------- import ----------------------------- */

const importSchema = z.object({
  label: z.string().trim().max(120).default(''),
  classLevel: z.string().trim().default(''),
  book: z.string().trim().default(''),
  csv: z.string().min(1).max(4_000_000),
  dryRun: z.boolean().default(false),
});

export const bankImportCsvFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => importSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const { rowsFromCsv } = await import('./bank.server');
    const { rows, skipped } = rowsFromCsv(data.csv, {
      class_level: data.classLevel,
      book: data.book,
    });

    if (data.dryRun) {
      return {
        preview: rows.slice(0, 12),
        totalRows: rows.length + skipped.length,
        validRows: rows.length,
        skipped: skipped.slice(0, 40),
        inserted: 0,
        duplicates: 0,
      };
    }

    if (!rows.length) {
      return {
        preview: [],
        totalRows: skipped.length,
        validRows: 0,
        skipped: skipped.slice(0, 40),
        inserted: 0,
        duplicates: 0,
      };
    }

    const client = await db();
    const { data: importRow } = await client
      .from('bank_imports')
      .insert({
        label: data.label || `Import ${new Date().toLocaleString()}`,
        class_level: data.classLevel,
        book: data.book,
        source: 'csv',
        status: 'running',
        total_rows: rows.length + skipped.length,
        created_by: (context as Ctx).userId,
      })
      .select('id')
      .single();

    const importId = importRow?.id ?? null;

    // De-duplicate inside the file, then let the unique fingerprint skip repeats.
    const seen = new Set<string>();
    const unique = rows.filter((r) => {
      if (seen.has(r.fingerprint)) return false;
      seen.add(r.fingerprint);
      return true;
    });

    let inserted = 0;
    for (let i = 0; i < unique.length; i += 200) {
      const chunk = unique.slice(i, i + 200).map((r) => ({
        ...r,
        options: r.options as unknown,
        answer_points: r.answer_points as unknown,
        import_id: importId,
        created_by: (context as Ctx).userId,
      }));
      const { data: out } = await client
        .from('bank_questions')
        .upsert(chunk, { onConflict: 'fingerprint', ignoreDuplicates: true })
        .select('id');
      inserted += (out ?? []).length;
    }

    const duplicates = unique.length - inserted + (rows.length - unique.length);

    if (importId) {
      await client
        .from('bank_imports')
        .update({
          status: 'done',
          inserted_rows: inserted,
          skipped_rows: skipped.length + duplicates,
        })
        .eq('id', importId);
    }

    return {
      preview: [],
      totalRows: rows.length + skipped.length,
      validRows: rows.length,
      skipped: skipped.slice(0, 40),
      inserted,
      duplicates,
    };
  });

export const bankSampleCsvFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as Ctx);
    const { sampleCsv } = await import('./bank.server');
    return { csv: sampleCsv() };
  });

/* --------------------------- edit / delete --------------------------- */

export const bankUpdateQuestionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        question_text: z.string().trim().min(3).max(4000).optional(),
        expected_answer: z.string().trim().max(4000).nullable().optional(),
        explanation: z.string().trim().max(4000).optional(),
        marks: z.number().int().min(1).max(50).optional(),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
        chapter: z.string().trim().max(200).optional(),
        is_active: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    const { id, ...patch } = data;
    const { error } = await client.from('bank_questions').update(patch).eq('id', id);
    if (error) throw new Error('Could not save the question.');
    return { ok: true };
  });

export const bankDeleteQuestionFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    await client.from('bank_questions').delete().eq('id', data.id);
    return { ok: true };
  });

export const bankDeleteImportFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const client = await db();
    await client.from('bank_questions').delete().eq('import_id', data.id);
    await client.from('bank_imports').delete().eq('id', data.id);
    return { ok: true };
  });

/* ------------------------- AI bulk fill (staff) ------------------------- */

const fillSchema = z.object({
  classLevel: z.string().trim().min(1),
  book: z.string().trim().min(1),
  chapter: z.string().trim().min(1),
  counts: z.object({
    mcq: z.number().int().min(0).max(30),
    short: z.number().int().min(0).max(30),
    long: z.number().int().min(0).max(15),
  }),
  language: z.enum(['english', 'urdu']).default('english'),
  mcqOptionsCount: z.number().int().min(2).max(6).default(4),
});

/**
 * One-time helper for the team: fills the bank with AI questions for a chapter.
 * Teachers never call this — it only feeds the offline bank.
 */
export const bankAiFillFn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => fillSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as Ctx);
    const total = data.counts.mcq + data.counts.short + data.counts.long;
    if (total < 1) throw new Error('Choose how many questions to create.');

    const { fillChapter } = await import('./bankBulk.server');
    return await fillChapter(context as Ctx, {
      classLevel: data.classLevel,
      book: data.book,
      chapter: data.chapter,
      counts: data.counts,
      language: data.language,
      mcqOptionsCount: data.mcqOptionsCount,
    });
  });
