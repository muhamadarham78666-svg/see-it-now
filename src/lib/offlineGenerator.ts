/**
 * Offline Paper Generator.
 *
 * Used automatically when AI / internet is unavailable. It builds a board-pattern
 * paper from local data only: the curriculum chapter list, the resolved board
 * pattern and local question templates per subject family.
 */

import type { Book, ClassGroup } from '@/lib/curriculum';
import type { PaperPattern } from '@/lib/paperPatterns';
import type { GeneratedQuestionData } from '@/services/aiService';
import type { Difficulty, QuestionTypeCounts } from '@/types';

type Family = Book['family'];

interface Templates {
  mcq: string[];
  short: string[];
  long: string[];
}

const EN: Record<Family, Templates> = {
  science: {
    mcq: [
      'Which of the following statements about {topic} is correct?',
      'The most suitable definition related to {topic} is:',
      'In {topic}, the correct SI unit / term is:',
      'Which one is NOT a feature of {topic}?',
    ],
    short: [
      'Define {topic} and give two examples.',
      'Write any two important points about {topic}.',
      'Differentiate between the two main types studied in {topic}.',
      'Why is {topic} important? Explain briefly.',
      'State the law / principle involved in {topic}.',
    ],
    long: [
      'Explain {topic} in detail with the help of a labelled diagram.',
      'Describe the process / mechanism studied in {topic} and mention its applications.',
      'Discuss the main concepts of {topic} and solve one related numerical / example.',
    ],
  },
  math: {
    mcq: [
      'In {topic}, the correct result is:',
      'Which formula is used in {topic}?',
      'The value obtained from the standard identity of {topic} is:',
      'Which statement about {topic} is true?',
    ],
    short: [
      'Solve a basic exercise from {topic}.',
      'State the formula used in {topic} and explain its terms.',
      'Simplify a standard expression related to {topic}.',
      'Find the required value using the method of {topic}.',
    ],
    long: [
      'Prove the main theorem / identity of {topic} with complete steps.',
      'Solve a detailed problem based on {topic} showing all working.',
      'Derive the general formula used in {topic} and apply it to one example.',
    ],
  },
  language: {
    mcq: [
      'Choose the correct option related to {topic}.',
      'The correct grammatical form used in {topic} is:',
      'The correct meaning / spelling from {topic} is:',
      'Which sentence from {topic} is grammatically correct?',
    ],
    short: [
      'Answer briefly a comprehension question from "{topic}".',
      'Explain the central idea of "{topic}" in two or three lines.',
      'Use two important words from "{topic}" in your own sentences.',
      'What lesson do we learn from "{topic}"?',
    ],
    long: [
      'Write a summary / detailed answer based on "{topic}".',
      'Translate a paragraph related to "{topic}".',
      'Write an essay / paragraph connected with the theme of "{topic}".',
    ],
  },
  humanities: {
    mcq: [
      'Which statement about {topic} is correct?',
      'The correct date / event related to {topic} is:',
      'Which of these is a feature of {topic}?',
      'The main cause discussed in {topic} was:',
    ],
    short: [
      'Write a short note on {topic}.',
      'Give two importance points of {topic}.',
      'What were the main causes discussed in {topic}?',
      'Define the key term used in {topic}.',
    ],
    long: [
      'Discuss {topic} in detail with its background and effects.',
      'Explain the importance of {topic} for Pakistan.',
      'Critically examine the main issues of {topic}.',
    ],
  },
  religious: {
    mcq: [
      '{topic} کے بارے میں درست بیان یہ ہے:',
      '{topic} سے متعلق درست جواب کا انتخاب کریں:',
      '{topic} میں بیان کردہ اہم بات یہ ہے:',
      'مندرجہ ذیل میں سے {topic} کی خصوصیت کون سی ہے؟',
    ],
    short: [
      '{topic} کی مختصر تشریح کریں۔',
      '{topic} سے متعلق دو اہم نکات لکھیں۔',
      '{topic} کی روشنی میں ہمیں کیا سبق ملتا ہے؟',
      '{topic} کی اہمیت مختصراً بیان کریں۔',
    ],
    long: [
      '{topic} پر تفصیلی نوٹ لکھیں۔',
      '{topic} کی روشنی میں اسلامی تعلیمات بیان کریں۔',
      '{topic} کا عملی زندگی پر اثر تفصیل سے بیان کریں۔',
    ],
  },
};

const UR: Templates = {
  mcq: [
    '{topic} کے بارے میں درست جواب کا انتخاب کریں:',
    '{topic} سے متعلق درست بیان یہ ہے:',
    '{topic} میں درست لفظ / اصطلاح یہ ہے:',
    'مندرجہ ذیل میں سے {topic} سے متعلق کون سا بیان درست ہے؟',
  ],
  short: [
    '{topic} کی مختصر تشریح کریں۔',
    '{topic} سے متعلق دو اہم نکات لکھیں۔',
    '{topic} کی اہمیت بیان کریں۔',
    '{topic} میں بیان کردہ خیال مختصراً لکھیں۔',
  ],
  long: [
    '{topic} پر تفصیلی نوٹ لکھیں۔',
    '{topic} کا خلاصہ اور تشریح لکھیں۔',
    '{topic} پر مضمون تحریر کریں۔',
  ],
};

function templatesFor(book: Book, urdu: boolean): Templates {
  if (urdu && book.family !== 'religious') return UR;
  return EN[book.family];
}

function pick<T>(list: T[], i: number): T {
  return list[i % list.length] as T;
}

function marksFor(pattern: PaperPattern, type: 'mcq' | 'short' | 'long') {
  const section = pattern.sections.find((s) => s.type === type);
  return section?.marksEach ?? (type === 'mcq' ? 1 : type === 'short' ? 2 : 8);
}

function difficultyFor(index: number, difficulty: Difficulty) {
  if (difficulty !== 'mixed') return difficulty;
  return index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard';
}

export interface OfflineRequest {
  group: ClassGroup;
  book: Book;
  pattern: PaperPattern;
  chapters: string[];
  counts: QuestionTypeCounts;
  difficulty: Difficulty;
  mcqOptionsCount: number;
  urdu: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/** Builds a complete board-pattern paper from local data only. */
export function generateOfflinePaper(req: OfflineRequest): GeneratedQuestionData[] {
  const { book, pattern, chapters, counts, difficulty, mcqOptionsCount, urdu } = req;
  const topics = chapters.length ? chapters : book.chapters;
  const templates = templatesFor(book, urdu);
  const out: GeneratedQuestionData[] = [];

  const build = (type: 'mcq' | 'short' | 'long', total: number) => {
    for (let i = 0; i < total; i++) {
      const topic = pick(topics, i);
      const text = pick(templates[type], i).replace(/\{topic\}/g, topic);
      const marks = marksFor(pattern, type);
      out.push({
        question_text: text,
        question_type: type,
        options:
          type === 'mcq'
            ? Array.from({ length: Math.max(2, Math.min(8, mcqOptionsCount)) }, (_, k) => ({
                label: LETTERS[k] as string,
                text: urdu ? `جواب ${LETTERS[k]}` : `Option ${LETTERS[k]}`,
              }))
            : null,
        correct_answer: type === 'mcq' ? 'A' : null,
        expected_answer:
          type === 'short'
            ? urdu
              ? `${topic} سے متعلق نصابی کتاب کے مطابق جواب۔`
              : `Refer to "${topic}" in the textbook for the expected answer.`
            : null,
        answer_points:
          type === 'long'
            ? [
                urdu ? 'تعارف' : 'Introduction / definition',
                urdu ? 'اہم نکات' : 'Main points from the chapter',
                urdu ? 'مثال یا خاکہ' : 'Example, diagram or numerical',
                urdu ? 'خلاصہ' : 'Conclusion',
              ]
            : null,
        explanation: urdu
          ? 'آف لائن موڈ: یہ سوال مقامی نصابی ڈیٹا سے تیار کیا گیا ہے۔'
          : 'Offline mode: generated from the local syllabus data — review before printing.',
        difficulty: difficultyFor(i, difficulty),
        topic,
        marks,
      });
    }
  };

  build('mcq', counts.mcq);
  build('short', counts.short);
  build('long', counts.long);

  return out;
}
