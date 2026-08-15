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

export interface GenerationSettings {
  language: Language;
  questionType: QuestionType;
  questionCount: number;
  difficulty: Difficulty;
  mcqOptionsCount: number;
  subject?: string;
  chapter?: string;
  title?: string;
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
