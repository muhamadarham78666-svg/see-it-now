import type { GenerationSettings, Question, QuestionOption } from '@/types';
import { supabase } from '@/lib/supabase';
import { generateQuestionsFn } from '@/lib/generate.functions';
import type { Json } from '@/integrations/supabase/types';

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
      options: (q.options ?? null) as Json,
      correct_answer: q.correct_answer ?? null,
      expected_answer: q.expected_answer ?? null,
      answer_points: (q.answer_points ?? null) as Json,
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

/** Raw bytes we are willing to inline (base64) into an AI request without shrinking. */
const MAX_INLINE_BYTES = 1.5 * 1024 * 1024;
/** Characters of extracted text we keep per file. */
const MAX_TEXT_CHARS = 150_000;
/** Pages of a scanned PDF we rasterise for AI vision. */
const MAX_SCAN_PAGES = 8;

export interface ParsedFile {
  text: string;
  dataUrl?: string;
  /** Rasterised page images for scanned documents (already compressed). */
  images?: string[];
  /** Non-fatal information for the user, e.g. only part of the file was read. */
  warning?: string;
}

export class DocumentParserService {
  /** Returns extracted text plus (when useful) compressed images for AI vision. */
  async parseFile(file: File): Promise<ParsedFile> {
    const mime = file.type || '';
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'heic', 'tif', 'tiff'].includes(ext)) {
      // Always try to shrink: big photos are the main cause of upload failures.
      try {
        const dataUrl =
          file.size > MAX_INLINE_BYTES ? await this.compressImage(file) : await this.toDataUrl(file);
        return { text: '', dataUrl };
      } catch {
        throw new Error('This image could not be read. Please try a PNG or JPG version.');
      }
    }

    if (mime === 'application/pdf' || ext === 'pdf') {
      const { text, pages, readPages } = await this.parsePdf(file);
      if (text.trim().length > 80) {
        return {
          text: this.clip(text),
          warning: readPages < pages ? `Read the first ${readPages} of ${pages} pages.` : undefined,
        };
      }
      // Scanned/handwritten PDF: rasterise a few pages instead of failing on size.
      const images = await this.pdfToImages(file);
      if (images.length) {
        return {
          text: '',
          images,
          warning: pages > images.length ? `Scanned PDF — read the first ${images.length} of ${pages} pages.` : undefined,
        };
      }
      if (file.size <= 4 * 1024 * 1024) {
        return { text: '', dataUrl: await this.toDataUrl(file, 'application/pdf') };
      }
      throw new Error('This PDF has no readable text. Please upload a clearer scan or split it into smaller parts.');
    }

    if (ext === 'docx' || ext === 'doc') {
      const text = await this.parseDoc(file);
      if (!text.trim()) throw new Error('This document appears to be empty or image-only.');
      return { text: this.clip(text) };
    }

    if (['txt', 'md', 'csv', 'rtf', 'json', 'html', 'htm', 'tex'].includes(ext) || mime.startsWith('text/')) {
      const text = await this.readTextSafely(file);
      if (!text.trim()) throw new Error('This file is empty.');
      return { text: this.clip(text) };
    }

    // Unknown extension: still try reading it as text before giving up.
    const text = await this.readTextSafely(file);
    // eslint-disable-next-line no-control-regex
    if (!text.trim() || /[\u0000-\u0008\u000E-\u001F]/.test(text.slice(0, 2000))) {
      throw new Error('This file type is not supported. Try PDF, DOC/DOCX, TXT or an image.');
    }
    return { text: this.clip(text) };
  }

  /** Reads only the first slice of huge text files so the browser does not run out of memory. */
  private async readTextSafely(file: File): Promise<string> {
    const slice = file.size > 20 * 1024 * 1024 ? file.slice(0, 20 * 1024 * 1024) : file;
    return await slice.text();
  }

  private clip(text: string): string {
    return text.length > MAX_TEXT_CHARS ? `${text.slice(0, MAX_TEXT_CHARS)}\n...` : text;
  }

  private async toDataUrl(file: Blob, forceMime?: string): Promise<string> {
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

  /** Downscales huge photos so they fit in an AI request instead of failing. */
  private async compressImage(file: File): Promise<string> {
    if (typeof document === 'undefined') {
      throw new Error('Image is too large to read');
    }
    const bitmapUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('Could not read this image'));
        element.src = bitmapUrl;
      });
      const maxSide = 2200;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not read this image');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.82),
      );
      if (!blob) throw new Error('Could not read this image');
      return this.toDataUrl(blob, 'image/jpeg');
    } finally {
      URL.revokeObjectURL(bitmapUrl);
    }
  }

  private async parsePdf(
    file: File,
  ): Promise<{ text: string; pages: number; readPages: number }> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist');
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const textParts: string[] = [];
      const maxPages = Math.min(pdf.numPages, 80);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        textParts.push(
          textContent.items.map((item) => ('str' in item ? item.str : '')).join(' '),
        );
      }
      return { text: textParts.join('\n\n').trim(), pages: pdf.numPages, readPages: maxPages };
    } catch {
      return { text: '', pages: 0, readPages: 0 };
    }
  }

  /** Rasterises the first pages of a scanned PDF into compressed JPEGs for AI vision. */
  private async pdfToImages(file: File): Promise<string[]> {
    if (typeof document === 'undefined') return [];
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist');
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const count = Math.min(pdf.numPages, MAX_SCAN_PAGES);
      const images: string[] = [];
      for (let i = 1; i <= count; i++) {
        const page = await pdf.getPage(i);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(2, 1600 / Math.max(base.width, base.height));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) break;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.75),
        );
        if (blob) images.push(await this.toDataUrl(blob, 'image/jpeg'));
      }
      return images;
    } catch {
      return [];
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
