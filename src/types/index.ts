export type QuestionType = 'mcq' | 'short' | 'long' | 'mixed';
export type Language = 'english' | 'urdu' | 'mixed';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type GenerationStatus = 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed';
export type PaperStatus = 'draft' | 'finalized';
export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  preferences: {
    theme?: 'light' | 'dark';
    language?: Language;
    defaultQuestionType?: QuestionType;
    defaultDifficulty?: Difficulty;
    defaultQuestionCount?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  title: string;
  source_text: string | null;
  source_file_name: string | null;
  source_file_type: string | null;
  language: Language;
  question_type: QuestionType;
  question_count: number;
  difficulty: Difficulty;
  mcq_options_count: number | null;
  status: GenerationStatus;
  subject: string | null;
  chapter: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  label: string;
  text: string;
}

export interface QuestionPart {
  label: string;
  text: string;
  marks: number;
}

export interface Question {
  id: string;
  user_id: string;
  generation_id: string | null;
  question_text: string;
  question_type: 'mcq' | 'short' | 'long';
  options: QuestionOption[] | null;
  correct_answer: string | null;
  expected_answer: string | null;
  answer_points: string[] | null;
  /** Long-question sub-parts, e.g. (a) and (b). */
  parts?: QuestionPart[] | null;
  /** Inline SVG figure/diagram for the question. */
  diagram_svg?: string | null;
  diagram_note?: string | null;
  /** One-line statement / مفہوم printed under the question. */
  statement?: string | null;
  /** Special item key: letter, essay, tashreeh, khulasa, translation... */
  category?: string | null;
  chapter?: string | null;
  explanation: string | null;
  marks: number;
  difficulty: QuestionDifficulty;
  topic: string | null;
  language: Language;
  sort_order: number;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
}


export interface Paper {
  id: string;
  user_id: string;
  title: string;
  institution_name: string | null;
  subject: string | null;
  class_name: string | null;
  chapter: string | null;
  exam_name: string | null;
  exam_date: string | null;
  exam_time: string | null;
  total_marks: number;
  instructions: string | null;
  logo_url: string | null;
  status: PaperStatus;
  created_at: string;
  updated_at: string;
}

export interface PaperQuestion {
  id: string;
  paper_id: string;
  question_id: string;
  user_id: string;
  sort_order: number;
  marks: number;
  created_at: string;
  question?: Question;
}

export interface QuestionTypeCounts {
  mcq: number;
  short: number;
  long: number;
}

export interface GenerationSettings {
  language: Language;
  questionType: QuestionType;
  questionCount: number;
  difficulty: Difficulty;
  mcqOptionsCount: number;
  typeCounts?: QuestionTypeCounts | null;
  subject?: string;
  chapter?: string;
  title?: string;
  /** Teacher's free-text requirements. */
  instructions?: string;
  /** Class / group label, e.g. "11th Class — Pre-Medical". */
  classGroup?: string;
  /** Book / subject name. */
  bookName?: string;
  /** Full Book / Half Book / Selected Chapters. */
  rangeLabel?: string;
  /** Chapters the paper must cover. */
  chapters?: string[];
  /** Board pattern brief for the AI + offline engine. */
  patternBrief?: string;
  /** Ask AI to include simple SVG diagrams where useful. */
  wantDiagrams?: boolean;
  /** Split long questions into parts (a) and (b). */
  longParts?: boolean;
  /** "Attempt any N" counts per section. */
  attempts?: QuestionTypeCounts | null;
  /** Composition / writing items the paper must contain. */
  composition?: string[] | null;
  /** Translation direction for English papers. */
  translation?: string | null;
  /** Print a one-line statement / مفہوم under each question. */
  statements?: boolean | null;
  /** Force the whole paper into Urdu. */
  forceUrdu?: boolean | null;
}

export interface PaperInfo {
  institutionName: string;
  subject: string;
  className: string;
  chapter: string;
  examName: string;
  examDate: string;
  examTime: string;
  totalMarks: number;
  instructions: string;
  logoUrl?: string;
}
