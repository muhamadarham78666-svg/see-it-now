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
  });

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
