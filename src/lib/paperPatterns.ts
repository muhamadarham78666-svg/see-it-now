/**
 * Board paper pattern configuration (Punjab Board style, ~70% board + 30% our own
 * improved structure).
 *
 * Patterns are pure configuration resolved by `<class>:<group>:<subject>` with
 * graceful fallbacks, so a board change only needs an edit here.
 */

import type { Book, ClassGroup, SubjectFamily } from '@/lib/curriculum';

export interface PatternSection {
  type: 'mcq' | 'short' | 'long';
  /** Printed section/question label, e.g. "Q.2" or "SECTION-I". */
  label: string;
  /** Instruction line printed under the label. */
  instruction: string;
  /** How many questions are printed. */
  total: number;
  /** How many the student must attempt (<= total). */
  attempt: number;
  /** Marks per attempted question. */
  marksEach: number;
}

export interface PaperPattern {
  key: string;
  label: string;
  objectiveTime: string;
  subjectiveTime: string;
  totalMarks: number;
  sections: PatternSection[];
  notes: string[];
}

const sum = (sections: PatternSection[]) =>
  sections.reduce((s, x) => s + x.attempt * x.marksEach, 0);

function pattern(
  key: string,
  label: string,
  objectiveTime: string,
  subjectiveTime: string,
  sections: PatternSection[],
  notes: string[],
): PaperPattern {
  return { key, label, objectiveTime, subjectiveTime, totalMarks: sum(sections), sections, notes };
}

/* ---------------------------------- SSC ---------------------------------- */

const sscScience = (mcq: number) =>
  pattern(
    'ssc-science',
    'Punjab Board — SSC Science',
    '15 Minutes',
    '2:15 Hours',
    [
      {
        type: 'mcq',
        label: 'Q.1',
        instruction: `Choose the correct option and fill the relevant circle. (${mcq} x 1 = ${mcq})`,
        total: mcq,
        attempt: mcq,
        marksEach: 1,
      },
      {
        type: 'short',
        label: 'Q.2',
        instruction: 'Write short answers to any FIVE questions. (5 x 2 = 10)',
        total: 8,
        attempt: 5,
        marksEach: 2,
      },
      {
        type: 'short',
        label: 'Q.3',
        instruction: 'Write short answers to any FIVE questions. (5 x 2 = 10)',
        total: 8,
        attempt: 5,
        marksEach: 2,
      },
      {
        type: 'short',
        label: 'Q.4',
        instruction: 'Write short answers to any FIVE questions. (5 x 2 = 10)',
        total: 8,
        attempt: 5,
        marksEach: 2,
      },
      {
        type: 'long',
        label: 'SECTION-II',
        instruction: 'Attempt any TWO detailed questions. (2 x 9 = 18)',
        total: 3,
        attempt: 2,
        marksEach: 9,
      },
    ],
    [
      'Section-I is compulsory. Objective paper must be returned within the given time.',
      'Numerical / theory balance follows the board scheme of studies.',
    ],
  );

const sscMath = pattern(
  'ssc-math',
  'Punjab Board — SSC Mathematics',
  '15 Minutes',
  '2:15 Hours',
  [
    {
      type: 'mcq',
      label: 'Q.1',
      instruction: 'Choose the correct option. (15 x 1 = 15)',
      total: 15,
      attempt: 15,
      marksEach: 1,
    },
    {
      type: 'short',
      label: 'Q.2',
      instruction: 'Solve any SIX parts. (6 x 2 = 12)',
      total: 9,
      attempt: 6,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.3',
      instruction: 'Solve any SIX parts. (6 x 2 = 12)',
      total: 9,
      attempt: 6,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.4',
      instruction: 'Solve any SIX parts. (6 x 2 = 12)',
      total: 9,
      attempt: 6,
      marksEach: 2,
    },
    {
      type: 'long',
      label: 'SECTION-II',
      instruction: 'Attempt any THREE questions. Prove / solve with complete steps. (3 x 4 = 12)',
      total: 5,
      attempt: 3,
      marksEach: 4,
    },
  ],
  ['Show all steps; marks are awarded for method as well as the final answer.'],
);

const sscEnglish = pattern(
  'ssc-english',
  'Punjab Board — SSC English (Compulsory)',
  '20 Minutes',
  '2:10 Hours',
  [
    {
      type: 'mcq',
      label: 'OBJECTIVE',
      instruction:
        'Tenses, spellings, meanings and grammar. Fill the correct circle. (19 x 1 = 19)',
      total: 19,
      attempt: 19,
      marksEach: 1,
    },
    {
      type: 'short',
      label: 'Q.2',
      instruction: 'Write short answers to any FIVE of the following questions. (5 x 2 = 10)',
      total: 8,
      attempt: 5,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.6 / Q.7',
      instruction:
        'Grammar work — change into indirect form / use pairs of words in sentences (any FIVE each). (10)',
      total: 16,
      attempt: 10,
      marksEach: 1,
    },
    {
      type: 'long',
      label: 'Q.3 – Q.5',
      instruction:
        'Translation (Urdu ↔ English), poem summary / paraphrase, and an essay or paragraph. Attempt as directed.',
      total: 5,
      attempt: 3,
      marksEach: 9,
    },
  ],
  [
    'Foreign / English medium candidates attempt the alternate questions.',
    'Essay 150–200 words, paragraph 100–150 words.',
  ],
);

const sscUrdu = pattern(
  'ssc-urdu',
  'پنجاب بورڈ — اردو (نہم/دہم)',
  '20 منٹ',
  '2:10 گھنٹے',
  [
    {
      type: 'mcq',
      label: 'حصہ معروضی',
      instruction: 'درست جواب کا دائرہ پر کریں۔ (20 x 1 = 20)',
      total: 20,
      attempt: 20,
      marksEach: 1,
    },
    {
      type: 'short',
      label: 'سوال 2',
      instruction: 'کسی پانچ سوالوں کے مختصر جواب لکھیں۔ (5 x 2 = 10)',
      total: 8,
      attempt: 5,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'سوال 3',
      instruction: 'کسی پانچ سوالوں کے مختصر جواب لکھیں۔ (5 x 2 = 10)',
      total: 8,
      attempt: 5,
      marksEach: 2,
    },
    {
      type: 'long',
      label: 'حصہ انشائی',
      instruction: 'تشریح، خلاصہ، مضمون اور قواعد — کوئی تین سوال حل کریں۔ (3 x 8 = 24)',
      total: 5,
      attempt: 3,
      marksEach: 8,
    },
  ],
  ['حصہ اول لازمی ہے۔', 'مضمون کے لیے سلیس اور رواں اردو استعمال کریں۔'],
);

const sscHumanities = pattern(
  'ssc-humanities',
  'Punjab Board — SSC Humanities',
  '15 Minutes',
  '2:15 Hours',
  [
    {
      type: 'mcq',
      label: 'Q.1',
      instruction: 'Choose the correct option. (12 x 1 = 12)',
      total: 12,
      attempt: 12,
      marksEach: 1,
    },
    {
      type: 'short',
      label: 'Q.2',
      instruction: 'Write short answers to any SIX questions. (6 x 2 = 12)',
      total: 9,
      attempt: 6,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.3',
      instruction: 'Write short answers to any SIX questions. (6 x 2 = 12)',
      total: 9,
      attempt: 6,
      marksEach: 2,
    },
    {
      type: 'long',
      label: 'SECTION-II',
      instruction: 'Attempt any TWO detailed questions. (2 x 6 = 12)',
      total: 3,
      attempt: 2,
      marksEach: 6,
    },
  ],
  ['Section-I is compulsory.'],
);

/* -------------------------------- HSSC ---------------------------------- */

const hsscScience = pattern(
  'hssc-science',
  'Punjab Board — HSSC Science',
  '20 Minutes',
  '2:40 Hours',
  [
    {
      type: 'mcq',
      label: 'OBJECTIVE',
      instruction: 'Choose the correct option and fill the relevant circle. (17 x 1 = 17)',
      total: 17,
      attempt: 17,
      marksEach: 1,
    },
    {
      type: 'short',
      label: 'Q.2',
      instruction: 'Write short answers to any EIGHT questions. (2 x 8 = 16)',
      total: 12,
      attempt: 8,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.3',
      instruction: 'Write short answers to any EIGHT questions. (2 x 8 = 16)',
      total: 12,
      attempt: 8,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.4',
      instruction: 'Write short answers to any SIX questions. (2 x 6 = 12)',
      total: 9,
      attempt: 6,
      marksEach: 2,
    },
    {
      type: 'long',
      label: 'SECTION-II',
      instruction:
        'Attempt any THREE questions. Each question carries parts (a) and (b). (3 x 8 = 24)',
      total: 5,
      attempt: 3,
      marksEach: 8,
    },
  ],
  [
    'Section-I is compulsory. Attempt any THREE (3) questions from Section-II.',
    'Long questions include theory part (a) and application / numerical part (b).',
  ],
);

const hsscMath = pattern(
  'hssc-math',
  'Punjab Board — HSSC Mathematics',
  '30 Minutes',
  '2:30 Hours',
  [
    {
      type: 'mcq',
      label: 'OBJECTIVE',
      instruction: 'Choose the correct option. (20 x 1 = 20)',
      total: 20,
      attempt: 20,
      marksEach: 1,
    },
    {
      type: 'short',
      label: 'Q.2',
      instruction: 'Solve any EIGHT parts. (8 x 2 = 16)',
      total: 12,
      attempt: 8,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.3',
      instruction: 'Solve any EIGHT parts. (8 x 2 = 16)',
      total: 12,
      attempt: 8,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.4',
      instruction: 'Solve any NINE parts. (9 x 2 = 18)',
      total: 12,
      attempt: 9,
      marksEach: 2,
    },
    {
      type: 'long',
      label: 'SECTION-II',
      instruction: 'Attempt any FIVE questions with complete working. (5 x 4 = 20)',
      total: 9,
      attempt: 5,
      marksEach: 4,
    },
  ],
  ['Use of scientific calculator is allowed unless stated otherwise.'],
);

const hsscEnglish = pattern(
  'hssc-english',
  'Punjab Board — HSSC English (Compulsory)',
  '20 Minutes',
  '2:40 Hours',
  [
    {
      type: 'mcq',
      label: 'OBJECTIVE',
      instruction: 'Grammar, meanings and usage — fill the correct circle. (20 x 1 = 20)',
      total: 20,
      attempt: 20,
      marksEach: 1,
    },
    {
      type: 'short',
      label: 'Q.2',
      instruction: 'Answer any FIVE questions from the text. (5 x 2 = 10)',
      total: 8,
      attempt: 5,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.3',
      instruction: 'Use any FIVE idioms / pairs of words in sentences. (5 x 2 = 10)',
      total: 10,
      attempt: 5,
      marksEach: 2,
    },
    {
      type: 'long',
      label: 'Q.4 – Q.6',
      instruction: 'Translation, précis / paraphrase and essay writing. Attempt as directed.',
      total: 5,
      attempt: 3,
      marksEach: 10,
    },
  ],
  ['Essay 250–300 words.', 'Foreign / English medium candidates attempt alternate questions.'],
);

const hsscUrdu = pattern(
  'hssc-urdu',
  'پنجاب بورڈ — اردو (انٹرمیڈیٹ)',
  '20 منٹ',
  '2:40 گھنٹے',
  [
    {
      type: 'mcq',
      label: 'حصہ معروضی',
      instruction: 'ہر سوال کے چار جوابات میں سے درست جواب کا دائرہ پر کریں۔ (20 x 1 = 20)',
      total: 20,
      attempt: 20,
      marksEach: 1,
    },
    {
      type: 'short',
      label: 'سوال 2',
      instruction: 'کسی آٹھ سوالوں کے مختصر جواب لکھیں۔ (8 x 2 = 16)',
      total: 12,
      attempt: 8,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'سوال 3',
      instruction: 'کسی چھ سوالوں کے مختصر جواب لکھیں۔ (6 x 2 = 12)',
      total: 9,
      attempt: 6,
      marksEach: 2,
    },
    {
      type: 'long',
      label: 'حصہ انشائی',
      instruction: 'تشریح، خلاصہ، مضمون اور عروض — کوئی تین سوال حل کریں۔ (3 x 8 = 24)',
      total: 5,
      attempt: 3,
      marksEach: 8,
    },
  ],
  ['حصہ اول لازمی ہے۔'],
);

const hsscHumanities = pattern(
  'hssc-humanities',
  'Punjab Board — HSSC Humanities / Religious',
  '20 Minutes',
  '2:40 Hours',
  [
    {
      type: 'mcq',
      label: 'OBJECTIVE',
      instruction: 'Choose the correct option. (17 x 1 = 17)',
      total: 17,
      attempt: 17,
      marksEach: 1,
    },
    {
      type: 'short',
      label: 'Q.2',
      instruction: 'Write short answers to any EIGHT questions. (8 x 2 = 16)',
      total: 12,
      attempt: 8,
      marksEach: 2,
    },
    {
      type: 'short',
      label: 'Q.3',
      instruction: 'Write short answers to any SIX questions. (6 x 2 = 12)',
      total: 9,
      attempt: 6,
      marksEach: 2,
    },
    {
      type: 'long',
      label: 'SECTION-II',
      instruction: 'Attempt any THREE detailed questions. (3 x 8 = 24)',
      total: 5,
      attempt: 3,
      marksEach: 8,
    },
  ],
  ['Section-I is compulsory.'],
);

/**
 * Registry. Keys are matched most-specific first:
 *   `<class>:<group>:<subject>` -> `<class>:<subject>` -> `<level>:<family>`
 */
export const PAPER_PATTERNS: Record<string, PaperPattern> = {
  // Subject-specific SSC
  '9:physics': sscScience(12),
  '9:chemistry': sscScience(12),
  '9:biology': sscScience(12),
  '9:cs': sscScience(10),
  '9:math': sscMath,
  '9:english': sscEnglish,
  '9:urdu': sscUrdu,
  '9:islamiat': sscHumanities,
  '9:tarjuma': sscHumanities,
  '9:sst': sscHumanities,
  '10:physics': sscScience(12),
  '10:chemistry': sscScience(12),
  '10:biology': sscScience(12),
  '10:cs': sscScience(10),
  '10:math': sscMath,
  '10:english': sscEnglish,
  '10:urdu': sscUrdu,
  '10:pakstudies': sscHumanities,
  '10:tarjuma': sscHumanities,

  // Subject-specific HSSC
  '11:physics': hsscScience,
  '11:chemistry': hsscScience,
  '11:biology': hsscScience,
  '11:cs': hsscScience,
  '11:math': hsscMath,
  '11:english': hsscEnglish,
  '11:urdu': hsscUrdu,
  '11:islamiat': hsscHumanities,
  '11:tarjuma': hsscHumanities,
  '12:physics': hsscScience,
  '12:chemistry': hsscScience,
  '12:biology': hsscScience,
  '12:cs': hsscScience,
  '12:math': hsscMath,
  '12:english': hsscEnglish,
  '12:urdu': hsscUrdu,
  '12:pakstudies': hsscHumanities,
  '12:tarjuma': hsscHumanities,

  // Family fallbacks
  'ssc:science': sscScience(12),
  'ssc:math': sscMath,
  'ssc:language': sscEnglish,
  'ssc:humanities': sscHumanities,
  'ssc:religious': sscHumanities,
  'hssc:science': hsscScience,
  'hssc:math': hsscMath,
  'hssc:language': hsscEnglish,
  'hssc:humanities': hsscHumanities,
  'hssc:religious': hsscHumanities,
};

export function resolvePattern(group: ClassGroup, book: Book): PaperPattern {
  const digits = group.classLevel.replace(/[^0-9]/g, '');
  const stage = digits === '9' || digits === '10' ? 'ssc' : 'hssc';
  const family: SubjectFamily = book.family;
  return (
    PAPER_PATTERNS[`${digits}:${group.key}:${book.subject}`] ??
    PAPER_PATTERNS[`${digits}:${book.subject}`] ??
    PAPER_PATTERNS[`${stage}:${family}`] ??
    hsscHumanities
  );
}

/** Default MCQ / short / long counts suggested by the resolved pattern. */
export function patternCounts(p: PaperPattern) {
  const of = (type: PatternSection['type']) =>
    p.sections.filter((s) => s.type === type).reduce((n, s) => n + s.total, 0);
  return { mcq: of('mcq'), short: of('short'), long: of('long') };
}

/** Compact brief handed to the AI (and used by the offline engine). */
export function patternBrief(p: PaperPattern): string {
  const lines = p.sections.map(
    (s) =>
      `- ${s.label} [${s.type}] ${s.instruction} (print ${s.total}, attempt ${s.attempt}, ${s.marksEach} marks each)`,
  );
  return [
    `BOARD PATTERN: ${p.label}`,
    `Objective time ${p.objectiveTime}; subjective time ${p.subjectiveTime}; total ${p.totalMarks} marks.`,
    ...lines,
    ...p.notes.map((n) => `Note: ${n}`),
  ].join('\n');
}
