/**
 * Offline paper builder: picks questions from the question bank only — no AI.
 * Selection stays balanced across the chosen chapters, honours the extra paper
 * options (long parts, مفہوم statements, composition and translation items) and
 * avoids repeating the questions this teacher received in recent papers.
 */
import type { GeneratedQuestionData } from '@/services/aiService';

type Ctx = { supabase: any; userId: string };

export interface OfflinePaperInput {
  classLevel: string;
  book: string;
  chapters: string[];
  counts: { mcq: number; short: number; long: number };
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  language: 'english' | 'urdu' | 'both';
  mcqOptionsCount: number;
  /** Writing / composition item keys the paper must include (letter, essay …). */
  composition?: string[] | null;
  /** Translation item requested for language papers. */
  translation?: string | null;
  /** Keep the one-line مفہوم / statement under each question. */
  statements?: boolean;
  /** Keep long questions split into parts (a) and (b) when the bank has them. */
  longParts?: boolean;
}

interface BankQuestion {
  id: string;
  chapter: string;
  topic: string;
  category: string | null;
  question_type: 'mcq' | 'short' | 'long';
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  marks: number;
  question_text: string;
  options: any;
  correct_answer: string | null;
  expected_answer: string | null;
  answer_points: any;
  parts: any;
  statement: string | null;
  explanation: string;
}

const SELECT =
  'id, chapter, topic, category, question_type, difficulty, language, marks, question_text, options, correct_answer, expected_answer, answer_points, parts, statement, explanation';

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Round-robin across chapters so every selected chapter is represented. */
function spreadPick(pool: BankQuestion[], total: number, avoid: Set<string>): BankQuestion[] {
  if (total <= 0) return [];
  const byChapter = new Map<string, BankQuestion[]>();
  for (const q of pool) {
    const key = q.chapter || '—';
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key)!.push(q);
  }
  for (const [key, list] of byChapter) {
    const fresh = shuffle(list.filter((q) => !avoid.has(q.id)));
    const used = shuffle(list.filter((q) => avoid.has(q.id)));
    byChapter.set(key, [...fresh, ...used]);
  }

  const keys = shuffle([...byChapter.keys()]);
  const picked: BankQuestion[] = [];
  let progress = true;
  while (picked.length < total && progress) {
    progress = false;
    for (const key of keys) {
      if (picked.length >= total) break;
      const next = byChapter.get(key)!.shift();
      if (next) {
        picked.push(next);
        progress = true;
      }
    }
  }
  return picked;
}

function toGenerated(
  q: BankQuestion,
  input: OfflinePaperInput,
): GeneratedQuestionData {
  const options =
    q.question_type === 'mcq' && Array.isArray(q.options)
      ? (q.options as { label: string; text: string }[]).slice(0, Math.max(2, input.mcqOptionsCount))
      : null;
  const parts =
    input.longParts !== false && q.question_type === 'long' && Array.isArray(q.parts) && q.parts.length
      ? (q.parts as { label: string; text: string; marks: number }[])
      : null;
  return {
    question_text: q.question_text,
    question_type: q.question_type,
    options,
    correct_answer: q.correct_answer,
    expected_answer: q.expected_answer,
    answer_points: Array.isArray(q.answer_points) ? (q.answer_points as string[]) : null,
    parts,
    statement: input.statements ? (q.statement ?? null) : null,
    category: q.category || null,
    explanation: q.explanation || '',
    difficulty: q.difficulty,
    topic: q.topic || q.chapter || null,
    marks: q.marks,
  } as GeneratedQuestionData;
}

export async function buildOfflinePaper(context: Ctx, input: OfflinePaperInput) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db = supabaseAdmin as unknown as any;
  const { recentQuestionIds } = await import('./entitlements.server');

  let query = db
    .from('bank_questions')
    .select(SELECT)
    .eq('is_active', true)
    .eq('class_level', input.classLevel)
    .eq('book', input.book)
    .limit(6000);

  if (input.chapters.length) query = query.in('chapter', input.chapters);
  if (input.language === 'urdu') query = query.eq('language', 'urdu');
  else if (input.language === 'english') query = query.eq('language', 'english');

  const { data, error } = await query;
  if (error) throw new Error('Could not read the question bank. Please try again.');

  let pool = (data ?? []) as BankQuestion[];
  if (input.difficulty !== 'mixed') {
    const strict = pool.filter((q) => q.difficulty === input.difficulty);
    if (strict.length >= 5) pool = strict;
  }

  const avoid = await recentQuestionIds(context);
  const shortfalls: string[] = [];
  const questions: GeneratedQuestionData[] = [];
  const usedIds: string[] = [];
  const taken = new Set<string>();

  // Special writing / composition items first, so they are never crowded out.
  const specialKeys = [
    ...(input.composition ?? []),
    ...(input.translation ? ['translation'] : []),
  ]
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  for (const key of Array.from(new Set(specialKeys))) {
    const matches = shuffle(
      pool.filter((q) => !taken.has(q.id) && (q.category ?? '').toLowerCase() === key),
    );
    const pick = matches.find((q) => !avoid.has(q.id)) ?? matches[0];
    if (pick) {
      taken.add(pick.id);
      questions.push(toGenerated(pick, input));
      usedIds.push(pick.id);
    } else {
      shortfalls.push(`${key}: no saved item in the bank yet`);
    }
  }

  (['mcq', 'short', 'long'] as const).forEach((type) => {
    const want = input.counts[type];
    if (want <= 0) return;
    const picked = spreadPick(
      pool.filter((q) => q.question_type === type && !taken.has(q.id)),
      want,
      avoid,
    );
    picked.forEach((q) => {
      taken.add(q.id);
      questions.push(toGenerated(q, input));
      usedIds.push(q.id);
    });
    if (picked.length < want) {
      shortfalls.push(
        `${type === 'mcq' ? 'MCQs' : type === 'short' ? 'short questions' : 'long questions'}: ${picked.length} of ${want} available`,
      );
    }
  });

  return { questions, usedIds, shortfalls, poolSize: pool.length };
}
