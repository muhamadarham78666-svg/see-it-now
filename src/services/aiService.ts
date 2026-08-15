import type { GenerationSettings, Question, QuestionOption } from '@/types';
import { supabase } from '@/lib/supabase';

export interface AIProvider {
  name: string;
  generateQuestions(content: string, settings: GenerationSettings): Promise<Question[]>;
}

export interface GeneratedQuestionData {
  question_text: string;
  question_type: 'mcq' | 'short' | 'long';
  options?: QuestionOption[];
  correct_answer?: string;
  expected_answer?: string;
  answer_points?: string[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
  marks: number;
}

export class GeminiProvider implements AIProvider {
  name = 'Gemini';

  async generateQuestions(content: string, settings: GenerationSettings): Promise<Question[]> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-questions`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ content, settings }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error ?? `AI generation failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error('AI returned unexpected data format');
    }

    const language: Question['language'] =
      settings.language === 'urdu' ? 'urdu' : settings.language === 'mixed' ? 'mixed' : 'english';

    return data.questions.map((q: Record<string, unknown>, i: number) => ({
      id: `temp-${i}`,
      user_id: '',
      generation_id: null,
      question_text: String(q.question_text ?? ''),
      question_type: (q.question_type as 'mcq' | 'short' | 'long') ?? 'mcq',
      options: (q.options as QuestionOption[]) ?? null,
      correct_answer: (q.correct_answer as string) ?? null,
      expected_answer: (q.expected_answer as string) ?? null,
      answer_points: (q.answer_points as string[]) ?? null,
      explanation: (q.explanation as string) ?? null,
      difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
      topic: (q.topic as string) ?? null,
      marks: (q.marks as number) ?? 1,
      language,
      sort_order: i,
      is_saved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }
}

export class QuestionGeneratorService {
  private provider: AIProvider;

  constructor(provider?: AIProvider) {
    this.provider = provider ?? new GeminiProvider();
  }

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  async generate(
    content: string,
    settings: GenerationSettings,
    onProgress?: (step: string) => void,
  ): Promise<GeneratedQuestionData[]> {
    onProgress?.('Analyzing Content');
    await new Promise((resolve) => setTimeout(resolve, 600));

    onProgress?.('Identifying Important Topics');
    await new Promise((resolve) => setTimeout(resolve, 600));

    onProgress?.('Generating Questions');
    const questions = await this.provider.generateQuestions(content, settings);

    onProgress?.('Checking Quality');
    await new Promise((resolve) => setTimeout(resolve, 500));

    onProgress?.('Finalizing');
    await new Promise((resolve) => setTimeout(resolve, 400));

    return questions as unknown as GeneratedQuestionData[];
  }

  async saveQuestions(
    userId: string,
    generationId: string,
    questions: GeneratedQuestionData[],
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
      sort_order: i,
      is_saved: true,
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(rows)
      .select();

    if (error) throw error;
    return data as unknown as Question[];
  }
}

export class DocumentParserService {
  async parseFile(file: File): Promise<string> {
    if (file.type === 'text/plain' || file.type === 'application/text') {
      return await file.text();
    }

    if (file.type.startsWith('image/')) {
      return await this.parseImage(file);
    }

    if (file.type === 'application/pdf') {
      return await this.parsePdf(file);
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'doc' || ext === 'docx') {
      return await this.parseDoc(file);
    }

    return await file.text();
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
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');
        textParts.push(pageText);
      }

      const text = textParts.join('\n\n').trim();
      if (!text) {
        return `[PDF: ${file.name} — No extractable text found. This may be a scanned document.]`;
      }
      return text;
    } catch {
      return `[PDF: ${file.name} — Could not extract text. Please paste the content manually.]`;
    }
  }

  private async parseDoc(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || `[Document: ${file.name} — No text found.]`;
    } catch {
      return `[Document: ${file.name} — Could not extract text. Please paste the content manually.]`;
    }
  }

  private async parseImage(file: File): Promise<string> {
    return `[Image: ${file.name} — Image upload detected. For best results, paste the text content manually, or ensure the AI can process the image.]`;
  }
}

export const questionGenerator = new QuestionGeneratorService();
export const documentParser = new DocumentParserService();
