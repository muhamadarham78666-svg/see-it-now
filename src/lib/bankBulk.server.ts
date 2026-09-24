/**
 * Bulk filler for the offline question bank.
 *
 * It walks only the books and chapters that live in `src/lib/curriculum.ts`
 * (the 2026 syllabus the team supplied) and tops every chapter up to a target
 * number of MCQ / short / long questions. Work is done one small batch per
 * call so the job is resumable: state lives in the bank itself, not in memory.
 */
import { CLASS_GROUPS, type Book, type ClassGroup } from './curriculum';

type Ctx = { supabase: any; userId: string };

export interface BulkTargets {
  mcq: number;
  short: number;
  long: number;
}

export interface BulkScope {
  classLevel: string; // '' = every class
  book: string; // '' = every book of the scope
  targets: BulkTargets;
}

/** Per-call ceiling so one AI request stays small and reliable. */
const BATCH = { mcq: 20, short: 15, long: 8 };

const COMPOSITION_BY_FAMILY: Record<string, string[]> = {
  language: ['letter', 'application', 'essay', 'story', 'dialogue', 'precis', 'comprehension'],
};

async function db() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as any;
}

function scopedBooks(scope: BulkScope): { group: ClassGroup; book: Book }[] {
  const out: { group: ClassGroup; book: Book }[] = [];
  for (const group of CLASS_GROUPS) {
    if (scope.classLevel && group.classLevel !== scope.classLevel) continue;
    for (const book of group.books) {
      if (scope.book && book.name !== scope.book) continue;
      out.push({ group, book });
    }
  }
  return out;
}

type CountKey = `${string}||${string}||${string}`;

async function coverage(scope: BulkScope) {
  const client = await db();
  let query = client
    .from('bank_questions')
    .select('class_level, book, chapter, question_type')
    .eq('is_active', true)
    .limit(60000);
  if (scope.classLevel) query = query.eq('class_level', scope.classLevel);
  if (scope.book) query = query.eq('book', scope.book);

  const { data, error } = await query;
  if (error) throw new Error('Could not read the question bank.');

  const map = new Map<CountKey, BulkTargets>();
  for (const row of data ?? []) {
    const key = `${row.class_level}||${row.book}||${row.chapter}` as CountKey;
    if (!map.has(key)) map.set(key, { mcq: 0, short: 0, long: 0 });
    const entry = map.get(key)!;
    if (row.question_type === 'mcq') entry.mcq += 1;
    else if (row.question_type === 'short') entry.short += 1;
    else entry.long += 1;
  }
  return map;
}

export interface BulkProgress {
  chapters: number;
  chaptersDone: number;
  questions: number;
  missing: number;
}

export type BulkJobStatus = 'running' | 'waiting' | 'paused' | 'completed' | 'blocked';

export interface BulkJob {
  id: string;
  status: BulkJobStatus;
  scope: BulkScope;
  progress: BulkProgress;
  nextRetryAt: string | null;
  lastMessage: string;
  lastChapter: string;
  updatedAt: string;
}

function asJob(row: any): BulkJob {
  return {
    id: String(row.id),
    status: row.status as BulkJobStatus,
    scope: {
      classLevel: String(row.class_level ?? ''),
      book: String(row.book ?? ''),
      targets: (row.targets ?? { mcq: 60, short: 30, long: 12 }) as BulkTargets,
    },
    progress: (row.progress ?? { chapters: 0, chaptersDone: 0, questions: 0, missing: 0 }) as BulkProgress,
    nextRetryAt: row.next_retry_at ? String(row.next_retry_at) : null,
    lastMessage: String(row.last_message ?? ''),
    lastChapter: String(row.last_chapter ?? ''),
    updatedAt: String(row.updated_at),
  };
}

export async function latestBulkJob(): Promise<BulkJob | null> {
  const client = await db();
  const { data, error } = await client
    .from('bank_bulk_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Could not read the bulk-fill status.');
  return data ? asJob(data) : null;
}

export async function startBulkJob(userId: string, scope: BulkScope): Promise<BulkJob> {
  const client = await db();
  const progress = await bulkProgress(scope);
  const { data: active } = await client
    .from('bank_bulk_jobs')
    .select('id')
    .in('status', ['running', 'waiting'])
    .limit(1)
    .maybeSingle();

  if (active?.id) {
    const { data, error } = await client
      .from('bank_bulk_jobs')
      .update({
        status: 'running',
        class_level: scope.classLevel,
        book: scope.book,
        targets: scope.targets,
        progress,
        next_retry_at: null,
        lease_until: null,
        last_message: 'Free-only filling is ready.',
      })
      .eq('id', active.id)
      .select('*')
      .single();
    if (error || !data) throw new Error('Could not resume the bulk-fill job.');
    return asJob(data);
  }

  const { data, error } = await client
    .from('bank_bulk_jobs')
    .insert({
      created_by: userId,
      status: 'running',
      class_level: scope.classLevel,
      book: scope.book,
      targets: scope.targets,
      progress,
      last_message: 'Free-only filling started.',
    })
    .select('*')
    .single();
  if (error || !data) throw new Error('Could not start the bulk-fill job.');
  return asJob(data);
}

export async function pauseBulkJob(jobId: string): Promise<BulkJob> {
  const client = await db();
  const { data, error } = await client
    .from('bank_bulk_jobs')
    .update({ status: 'paused', next_retry_at: null, lease_until: null, last_message: 'Paused safely.' })
    .eq('id', jobId)
    .select('*')
    .single();
  if (error || !data) throw new Error('Could not pause the bulk-fill job.');
  return asJob(data);
}

function waitUntil(seconds: number) {
  return new Date(Date.now() + Math.max(60, Math.min(seconds, 86_400)) * 1000).toISOString();
}

export async function runBulkJob(jobId?: string): Promise<BulkJob | null> {
  const client = await db();
  let query = client.from('bank_bulk_jobs').select('*');
  query = jobId
    ? query.eq('id', jobId)
    : query.in('status', ['running', 'waiting']).order('created_at', { ascending: true }).limit(1);
  const { data: row, error } = await query.maybeSingle();
  if (error) throw new Error('Could not read the bulk-fill job.');
  if (!row) return null;

  if (row.status === 'waiting' && row.next_retry_at && new Date(row.next_retry_at).getTime() > Date.now()) {
    return asJob(row);
  }
  if (!['running', 'waiting'].includes(row.status)) return asJob(row);

  const { data: claimed } = await client.rpc('claim_bank_bulk_job', { _job_id: row.id, _lease_seconds: 300 });
  if (!claimed) return asJob(row);

  const scope: BulkScope = {
    classLevel: String(row.class_level ?? ''),
    book: String(row.book ?? ''),
    targets: row.targets as BulkTargets,
  };

  try {
    const result = await bulkStep({ supabase: client, userId: row.created_by }, scope);
    const current = result.current
      ? `${result.current.classLevel} • ${result.current.book} • ${result.current.chapter}`
      : row.last_chapter;
    const { data } = await client
      .from('bank_bulk_jobs')
      .update({
        status: result.done ? 'completed' : 'running',
        progress: result.progress,
        next_retry_at: null,
        lease_until: null,
        consecutive_failures: 0,
        last_chapter: current,
        last_message: result.done
          ? 'All selected chapters reached their targets.'
          : `${result.created} new questions saved.`,
      })
      .eq('id', row.id)
      .select('*')
      .single();
    return data ? asJob(data) : null;
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : '';
    const waitMatch = /^FREE_QUOTA_WAIT:(\d+)$/.exec(message);
    const blocked = message === 'FREE_PROVIDER_BLOCKED' || !waitMatch;
    const retrySeconds = waitMatch ? Number(waitMatch[1]) : 3600;
    const status: BulkJobStatus = blocked ? 'blocked' : 'waiting';
    const safeMessage = blocked
      ? 'Free AI needs attention. Saved progress is safe.'
      : 'Paid credits are protected. Free AI is resting and will resume automatically.';
    const { data } = await client
      .from('bank_bulk_jobs')
      .update({
        status,
        next_retry_at: blocked ? null : waitUntil(retrySeconds),
        lease_until: null,
        consecutive_failures: Number(row.consecutive_failures ?? 0) + 1,
        last_message: safeMessage,
      })
      .eq('id', row.id)
      .select('*')
      .single();
    return data ? asJob(data) : null;
  }
}

/** How far the whole scope is from its targets. */
export async function bulkProgress(scope: BulkScope): Promise<BulkProgress> {
  const map = await coverage(scope);
  const books = scopedBooks(scope);
  let chapters = 0;
  let chaptersDone = 0;
  let questions = 0;
  let missing = 0;

  for (const { group, book } of books) {
    for (const chapter of book.chapters) {
      chapters += 1;
      const have = map.get(`${group.classLevel}||${book.name}||${chapter}` as CountKey) ?? {
        mcq: 0,
        short: 0,
        long: 0,
      };
      questions += have.mcq + have.short + have.long;
      const gap =
        Math.max(0, scope.targets.mcq - have.mcq) +
        Math.max(0, scope.targets.short - have.short) +
        Math.max(0, scope.targets.long - have.long);
      missing += gap;
      if (gap === 0) chaptersDone += 1;
    }
  }
  return { chapters, chaptersDone, questions, missing };
}

/** The next chapter that is still short of its targets. */
async function nextTask(scope: BulkScope) {
  const map = await coverage(scope);
  for (const { group, book } of scopedBooks(scope)) {
    for (const chapter of book.chapters) {
      const have = map.get(`${group.classLevel}||${book.name}||${chapter}` as CountKey) ?? {
        mcq: 0,
        short: 0,
        long: 0,
      };
      const need = {
        mcq: Math.min(BATCH.mcq, Math.max(0, scope.targets.mcq - have.mcq)),
        short: Math.min(BATCH.short, Math.max(0, scope.targets.short - have.short)),
        long: Math.min(BATCH.long, Math.max(0, scope.targets.long - have.long)),
      };
      if (need.mcq + need.short + need.long > 0) {
        return { group, book, chapter, need };
      }
    }
  }
  return null;
}

/**
 * Generates one batch for a single chapter and saves it in the bank.
 * Returns how many rows were actually added (duplicates are skipped).
 */
export async function fillChapter(
  context: Ctx,
  input: {
    classLevel: string;
    book: string;
    chapter: string;
    counts: BulkTargets;
    language: 'english' | 'urdu';
    mcqOptionsCount?: number;
    composition?: string[] | null;
    bookFamily?: string | undefined;
  },
) {
  const total = input.counts.mcq + input.counts.short + input.counts.long;
  if (total < 1) return { created: 0, attempted: 0 };

  const composition =
    input.composition ??
    (input.bookFamily ? (COMPOSITION_BY_FAMILY[input.bookFamily] ?? null) : null);

  const { requestQuestions, normalizeQuestions } = await import('./generate.server');
  const raw = await requestQuestions('', [], {
    language: input.language,
    questionType: 'mixed',
    questionCount: total,
    difficulty: 'mixed',
    mcqOptionsCount: input.mcqOptionsCount ?? 4,
    typeCounts: input.counts,
    subject: input.book,
    chapter: input.chapter,
    classGroup: input.classLevel,
    bookName: input.book,
    rangeLabel: 'Selected Chapters',
    chapters: [input.chapter],
    forceUrdu: input.language === 'urdu',
    longParts: input.counts.long > 0,
    statements: true,
    composition: composition && input.counts.long > 0 ? composition.slice(0, 3) : null,
    instructions:
      'Create board-exam style questions strictly from this chapter of the Punjab textbook. Cover the whole chapter, avoid repeating wording, and always include the expected answer or answer points.',
  }, { freeOnly: true });

  const drafts = normalizeQuestions(raw, { allowDiagrams: false });
  if (!drafts.length) return { created: 0, attempted: 0 };

  const { fingerprint } = await import('./bank.server');
  const client = await db();

  const rows = drafts.map((q) => ({
    class_level: input.classLevel,
    book: input.book,
    chapter: input.chapter,
    topic: q.topic ?? input.chapter,
    category: q.category ?? '',
    question_type: q.question_type,
    language: input.language,
    difficulty: q.difficulty,
    marks: q.marks,
    question_text: q.question_text,
    options: q.options as unknown,
    correct_answer: q.correct_answer ?? null,
    expected_answer: q.expected_answer ?? null,
    answer_points: (q.answer_points ?? null) as unknown,
    parts: (q.parts ?? null) as unknown,
    statement: q.statement ?? null,
    explanation: q.explanation ?? '',
    fingerprint: fingerprint({
      class_level: input.classLevel,
      book: input.book,
      chapter: input.chapter,
      question_text: q.question_text,
    }),
    created_by: context.userId,
  }));

  const { data: out, error } = await client
    .from('bank_questions')
    .upsert(rows, { onConflict: 'fingerprint', ignoreDuplicates: true })
    .select('id');
  if (error) throw new Error('Could not save the generated questions.');

  return { created: (out ?? []).length, attempted: rows.length };
}

/** One step of the bulk job: pick the next needy chapter, fill it, report. */
export async function bulkStep(context: Ctx, scope: BulkScope) {
  const task = await nextTask(scope);
  if (!task) {
    const progress = await bulkProgress(scope);
    return { done: true, progress, current: null, created: 0, attempted: 0 };
  }

  const { created, attempted } = await fillChapter(context, {
    classLevel: task.group.classLevel,
    book: task.book.name,
    chapter: task.chapter,
    counts: task.need,
    language: task.book.urdu ? 'urdu' : 'english',
    bookFamily: task.book.family,
  });

  const progress = await bulkProgress(scope);
  return {
    done: false,
    progress,
    current: {
      classLevel: task.group.classLevel,
      book: task.book.name,
      chapter: task.chapter,
      asked: task.need,
    },
    created,
    attempted,
  };
}
