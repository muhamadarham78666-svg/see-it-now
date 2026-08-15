import type { GenerationSettings, Question, QuestionOption } from '@/types';
import { supabase } from '@/lib/supabase';
import { generateQuestionsFn } from '@/lib/generate.functions';

export interface GenAttachment {
  name: string;
  mime: string;
  dataUrl?: string | null;
  text?: string | null;
}

export interface AIProvider {
  name: string;
  generateQuestions(
    content: string,
    attachments: GenAttachment[],
    settings: GenerationSettings,
  ): Promise<GeneratedQuestionData[]>;
}

export interface GeneratedQuestionData {
  question_text: string;
  question_type: 'mcq' | 'short' | 'long';
  options?: QuestionOption[] | null;
  correct_answer?: string | null;
  expected_answer?: string | null;
  answer_points?: string[] | null;
  explanation?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string | null;
  marks: number;
}

export class LovableAIProvider implements AIProvider {
  name = 'Lovable AI';

  async generateQuestions(
    content: string,
    attachments: GenAttachment[],
    settings: GenerationSettings,
  ): Promise<GeneratedQuestionData[]> {
    const result = await generateQuestionsFn({
      data: {
        text: content,
        attachments: attachments.map((a) => ({
          name: a.name,
          mime: a.mime,
          dataUrl: a.dataUrl ?? null,
          text: a.text ?? null,
        })),
        settings: {
          language: settings.language,
          questionType: settings.questionType,
          questionCount: settings.questionCount,
          difficulty: settings.difficulty,
          mcqOptionsCount: settings.mcqOptionsCount,
          typeCounts: settings.typeCounts ?? null,
          subject: settings.subject ?? null,
          chapter: settings.chapter ?? null,
        },
      },
    });

    return result.questions as GeneratedQuestionData[];
  }
}

export class QuestionGeneratorService {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider ?? new LovableAIProvider();
  }

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  async generate(
    content: string,
    attachments: GenAttachment[],
    settings: GenerationSettings,
    onProgress?: (step: string) => void,
  ): Promise<GeneratedQuestionData[]> {
    onProgress?.('Analyzing Content');
    onProgress?.('Identifying Important Topics');
    onProgress?.('Generating Questions');
    const questions = await this.provider.generateQuestions(content, attachments, settings);
    onProgress?.('Checking Quality');
    onProgress?.('Finalizing');
    return questions;
  }

  toLocalQuestions(
    questions: GeneratedQuestionData[],
    language: Question['language'],
  ): Question[] {
    const now = new Date().toISOString();
    return questions.map((q, i) => ({
      id: `local-${Date.now()}-${i}`,
      user_id: '',
      generation_id: null,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options ?? null,
      correct_answer: q.correct_answer ?? null,
      expected_answer: q.expected_answer ?? null,
      answer_points: q.answer_points ?? null,
      explanation: q.explanation ?? null,
      difficulty: q.difficulty,
      topic: q.topic ?? null,
      marks: q.marks,
      language,
      sort_order: i,
      is_saved: false,
      created_at: now,
      updated_at: now,
    }));
  }

  async saveQuestions(
    userId: string,
    generationId: string | null,
    questions: GeneratedQuestionData[],
    language: Question['language'],
  ): Promise<Question[]> {
    const rows = questions.map((q, i) => ({
      user_id: userId,
      generation_id: generationId,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options ?? null,
      correct_answer: q.correct_answer ?? null,
      expected_answer: q.expected_answer ?? null,
      answer_points: q.answer_points ?? null,
      explanation: q.explanation ?? null,
      difficulty: q.difficulty,
      topic: q.topic ?? null,
      marks: q.marks,
      language,
      sort_order: i,
      is_saved: true,
    }));

    const { data, error } = await supabase.from('questions').insert(rows).select();
    if (error) throw error;
    return data as unknown as Question[];
  }
}

export class DocumentParserService {
  /** Returns extracted text plus (when useful) the raw file as a data URL for AI vision. */
  async parseFile(file: File): Promise<{ text: string; dataUrl?: string }> {
    const mime = file.type || '';
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
      return { text: '', dataUrl: await this.toDataUrl(file) };
    }

    if (mime === 'application/pdf' || ext === 'pdf') {
      const text = await this.parsePdf(file);
      if (text.trim().length > 80) return { text };
      // Scanned PDF — let the AI read it directly.
      return { text: '', dataUrl: await this.toDataUrl(file, 'application/pdf') };
    }

    if (ext === 'docx' || ext === 'doc') {
      return { text: await this.parseDoc(file) };
    }

    const text = await file.text();
    // Reject binary junk we cannot read.
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u0008\u000E-\u001F]/.test(text.slice(0, 2000))) {
      throw new Error('Unsupported file type');
    }
    return { text };
  }

  private async toDataUrl(file: File, forceMime?: string): Promise<string> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const mime = forceMime || file.type || 'application/octet-stream';
    return `data:${mime};base64,${btoa(binary)}`;
  }

  private async parsePdf(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist');
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const textParts: string[] = [];
      const maxPages = Math.min(pdf.numPages, 50);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        textParts.push(
          textContent.items.map((item) => ('str' in item ? item.str : '')).join(' '),
        );
      }
      return textParts.join('\n\n').trim();
    } catch {
      return '';
    }
  }

  private async parseDoc(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value?.trim() || '';
  }
}

export const questionGenerator = new QuestionGeneratorService();
export const documentParser = new DocumentParserService();
