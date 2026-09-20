/**
 * Offline question bank helpers: CSV parsing, normalising and fingerprinting.
 * The bank is the only source the offline paper generator uses.
 */

export interface BankRow {
  class_level: string;
  book: string;
  chapter: string;
  topic: string;
  question_type: 'mcq' | 'short' | 'long';
  language: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  question_text: string;
  options: { label: string; text: string }[] | null;
  correct_answer: string | null;
  expected_answer: string | null;
  answer_points: string[] | null;
  explanation: string;
  fingerprint: string;
}

export const CSV_HEADERS = [
  'class_level',
  'book',
  'chapter',
  'question_type',
  'language',
  'difficulty',
  'marks',
  'question_text',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
  'expected_answer',
  'answer_points',
  'explanation',
  'topic',
] as const;

/** Small RFC-4180 style CSV reader (handles quotes, commas and newlines inside fields). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

function squash(value: string) {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Stable duplicate key: same class + book + chapter + wording = same question. */
export function fingerprint(parts: {
  class_level: string;
  book: string;
  chapter: string;
  question_text: string;
}) {
  const base = [
    squash(parts.class_level),
    squash(parts.book),
    squash(parts.chapter),
    squash(parts.question_text),
  ].join('|');
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < base.length; i += 1) {
    const c = base.charCodeAt(i);
    h1 = (h1 ^ c) * 16777619 >>> 0;
    h2 = (h2 + c * (i + 7)) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

const TYPES = new Set(['mcq', 'short', 'long']);
const DIFFS = new Set(['easy', 'medium', 'hard']);

function defaultMarks(type: string) {
  return type === 'mcq' ? 1 : type === 'short' ? 2 : 8;
}

/** Turns one raw record into a validated bank row, or returns why it was skipped. */
export function normalizeRow(
  raw: Record<string, string>,
  fallback: { class_level: string; book: string },
): { row: BankRow } | { error: string } {
  const get = (key: string) => (raw[key] ?? '').toString().trim();

  const class_level = get('class_level') || fallback.class_level;
  const book = get('book') || fallback.book;
  const chapter = get('chapter');
  const question_text = get('question_text');
  const type = get('question_type').toLowerCase();

  if (!class_level) return { error: 'Class is missing' };
  if (!book) return { error: 'Book is missing' };
  if (!question_text) return { error: 'Question text is missing' };
  if (!TYPES.has(type)) return { error: `Type must be mcq, short or long (got "${type || '—'}")` };

  const question_type = type as 'mcq' | 'short' | 'long';
  const difficultyRaw = get('difficulty').toLowerCase();
  const difficulty = (DIFFS.has(difficultyRaw) ? difficultyRaw : 'medium') as BankRow['difficulty'];
  const marksNum = Number(get('marks'));
  const marks = Number.isFinite(marksNum) && marksNum > 0 ? Math.min(Math.round(marksNum), 50) : defaultMarks(question_type);

  let options: BankRow['options'] = null;
  let correct_answer: string | null = null;
  if (question_type === 'mcq') {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    options = labels
      .map((label) => ({ label, text: get(`option_${label.toLowerCase()}`) }))
      .filter((o) => o.text !== '');
    if (options.length < 2) return { error: 'An MCQ needs at least two options' };
    const answer = get('correct_answer').toUpperCase().replace(/[^A-F]/g, '').slice(0, 1);
    if (!answer || !options.some((o) => o.label === answer))
      return { error: 'Correct answer must be one of the given option letters' };
    correct_answer = answer;
  }

  const pointsRaw = get('answer_points');
  const answer_points = pointsRaw
    ? pointsRaw
        .split(/\s*(?:\||;|\n)\s*/)
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 12)
    : null;

  const language = /[\u0600-\u06FF]/.test(question_text)
    ? 'urdu'
    : (get('language').toLowerCase() || 'english');

  const row: BankRow = {
    class_level,
    book,
    chapter,
    topic: get('topic') || chapter,
    question_type,
    language,
    difficulty,
    marks,
    question_text,
    options,
    correct_answer,
    expected_answer: question_type === 'short' ? get('expected_answer') || null : get('expected_answer') || null,
    answer_points: question_type === 'long' ? answer_points : answer_points,
    explanation: get('explanation'),
    fingerprint: fingerprint({ class_level, book, chapter, question_text }),
  };
  return { row };
}

/** CSV text -> validated rows + skipped explanations. */
export function rowsFromCsv(csv: string, fallback: { class_level: string; book: string }) {
  const table = parseCsv(csv);
  if (!table.length) return { rows: [], skipped: [{ line: 0, reason: 'The file is empty' }] };

  const header = table[0]!.map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: BankRow[] = [];
  const skipped: { line: number; reason: string }[] = [];

  table.slice(1).forEach((cells, index) => {
    const raw: Record<string, string> = {};
    header.forEach((key, i) => {
      raw[key] = cells[i] ?? '';
    });
    const result = normalizeRow(raw, fallback);
    if ('error' in result) skipped.push({ line: index + 2, reason: result.error });
    else rows.push(result.row);
  });

  return { rows, skipped };
}

/** The CSV template teachers download before filling the bank. */
export function sampleCsv() {
  const header = CSV_HEADERS.join(',');
  const sample = [
    '9th,Physics,1 - Physical Quantities and Measurement,mcq,english,easy,1,"The SI unit of length is:",metre,litre,second,kilogram,A,,,"Base unit of length.",Measurement',
    '9th,Physics,1 - Physical Quantities and Measurement,short,english,medium,2,"Define a base quantity and give two examples.",,,,,,"A quantity that does not depend on others, e.g. length and mass.",,"Textbook definition.",Measurement',
    '9th,Physics,1 - Physical Quantities and Measurement,long,english,hard,8,"Explain the international system of units with examples.",,,,,,,"Introduction|Base units|Derived units|Conclusion","Cover all seven base units.",Measurement',
  ];
  return [header, ...sample].join('\n');
}
