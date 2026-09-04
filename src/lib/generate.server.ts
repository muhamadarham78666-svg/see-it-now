export interface GenAttachment {
  name: string;
  mime: string;
  dataUrl?: string | null;
  text?: string | null;
}

export interface GenSettings {
  language: string;
  questionType: string;
  questionCount: number;
  difficulty: string;
  mcqOptionsCount: number;
  typeCounts?: { mcq: number; short: number; long: number } | null;
  subject?: string | null;
  chapter?: string | null;
  /** Free-text teacher requirements. */
  instructions?: string | null;
  /** Class / group label, e.g. "11th Class — Pre-Medical". */
  classGroup?: string | null;
  /** Selected book name. */
  bookName?: string | null;
  /** Full Book / Half Book / Selected Chapters. */
  rangeLabel?: string | null;
  /** Chapters that the paper must cover. */
  chapters?: string[] | null;
  /** Board pattern brief produced by paperPatterns.patternBrief(). */
  patternBrief?: string | null;
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

function languageRule(lang: string) {
  if (lang === "urdu") return "Write EVERY question, option and answer in Urdu script only.";
  if (lang === "mixed")
    return "Write roughly half of the questions in English and half in Urdu script.";
  return "Write everything in clear English.";
}

export function buildInstruction(settings: GenSettings) {
  const counts = settings.typeCounts;
  const mix =
    settings.questionType === "mixed" && counts
      ? `Generate EXACTLY ${counts.mcq} MCQ questions, EXACTLY ${counts.short} short-answer questions and EXACTLY ${counts.long} long-answer questions (total ${counts.mcq + counts.short + counts.long}).`
      : settings.questionType === "mixed"
        ? `Generate exactly ${settings.questionCount} questions with a balanced mix of mcq, short and long types.`
        : `Generate exactly ${settings.questionCount} questions, all of type "${settings.questionType}".`;

  return [
    "You are an expert Punjab Board exam paper setter for Pakistani schools and colleges.",
    "If study material is provided (text, images, scans or documents), build the questions strictly from it. If no material is provided, use the standard Punjab textbook syllabus for the given class, book and chapters.",
    settings.classGroup ? `Class / Group: ${settings.classGroup}.` : "",
    settings.bookName ? `Book / Subject: ${settings.bookName}.` : "",
    settings.rangeLabel ? `Paper range: ${settings.rangeLabel}.` : "",
    settings.chapters && settings.chapters.length
      ? `Cover ONLY these chapters, spread the questions fairly across them: ${settings.chapters.join("; ")}.`
      : "",
    settings.patternBrief
      ? `Follow this board pattern closely (about 70% board style, 30% improved original style — questions must be NEW, never copied):\n${settings.patternBrief}`
      : "",
    settings.instructions
      ? `TEACHER'S SPECIAL INSTRUCTIONS (highest priority, obey them): ${settings.instructions}`
      : "",
    mix,
    `Difficulty: ${settings.difficulty === "mixed" ? "mix easy, medium and hard" : settings.difficulty}.`,
    `Each MCQ must have exactly ${settings.mcqOptionsCount} options labelled A, B, C... and one correct_answer holding the correct option label.`,
    languageRule(settings.language),
    settings.subject ? `Subject: ${settings.subject}.` : "",
    settings.chapter ? `Chapter: ${settings.chapter}.` : "",
    "Short questions get 2 marks, long questions get 5 marks, MCQs get 1 mark unless the material implies otherwise.",
    'Return ONLY JSON in this shape: {"questions":[{"question_text":string,"question_type":"mcq"|"short"|"long","options":[{"label":"A","text":string}]|null,"correct_answer":string|null,"expected_answer":string|null,"answer_points":string[]|null,"explanation":string,"difficulty":"easy"|"medium"|"hard","topic":string,"marks":number}]}',
    "If the material is an image or scan, first read (OCR) all visible text, then build the questions from it.",
  ]
    .filter(Boolean)
    .join("\n");
}

type Block = Record<string, unknown>;

export function buildContentBlocks(
  text: string,
  attachments: GenAttachment[],
  settings: GenSettings,
): Block[] {
  const blocks: Block[] = [{ type: "text", text: buildInstruction(settings) }];

  const textParts: string[] = [];
  if (text.trim()) textParts.push(text.trim());
  for (const a of attachments) {
    if (a.text && a.text.trim()) textParts.push(`--- ${a.name} ---\n${a.text.trim()}`);
  }
  if (textParts.length) {
    blocks.push({ type: "text", text: `STUDY MATERIAL:\n${textParts.join("\n\n")}` });
  }

  for (const a of attachments) {
    if (!a.dataUrl) continue;
    if (a.mime.startsWith("image/")) {
      blocks.push({ type: "image_url", image_url: { url: a.dataUrl } });
    } else if (a.mime === "application/pdf") {
      blocks.push({ type: "file", file: { filename: a.name, file_data: a.dataUrl } });
    }
  }

  return blocks;
}

function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI returned an unreadable response. Please try again.");
  }
}

export async function requestQuestions(
  text: string,
  attachments: GenAttachment[],
  settings: GenSettings,
): Promise<Record<string, unknown>[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const body = {
    model: MODEL,
    messages: [{ role: "user", content: buildContentBlocks(text, attachments, settings) }],
    response_format: { type: "json_object" as const },
  };

  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = json.choices?.[0]?.message?.content ?? "";
      const parsed = extractJson(raw) as { questions?: Record<string, unknown>[] };
      const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
      if (!questions.length) throw new Error("AI could not create questions from this material.");
      return questions;
    }

    lastError = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error("AI rate limit reached. Please wait a moment and try again.");
    if (res.status < 500) break;
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }

  throw new Error(
    lastError ? `AI generation failed: ${lastError.slice(0, 200)}` : "AI generation failed.",
  );
}

export interface QuestionDraft {
  question_text: string;
  question_type: "mcq" | "short" | "long";
  options: { label: string; text: string }[] | null;
  correct_answer: string | null;
  expected_answer: string | null;
  answer_points: string[] | null;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  topic: string | null;
  marks: number;
}

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export function normalizeQuestions(raw: Record<string, unknown>[]): QuestionDraft[] {
  return raw.map((q) => {
    const type = ((): QuestionDraft["question_type"] => {
      const t = String(q["question_type"] ?? "mcq").toLowerCase();
      return t === "short" || t === "long" ? t : "mcq";
    })();
    const rawOptions = Array.isArray(q["options"]) ? (q["options"] as unknown[]) : null;
    const options =
      type === "mcq" && rawOptions
        ? rawOptions.map((o, i) => {
            const obj = (typeof o === "object" && o !== null ? o : {}) as Record<string, unknown>;
            return {
              label: String(obj["label"] ?? LETTERS[i] ?? String(i + 1)),
              text: String(obj["text"] ?? (typeof o === "string" ? o : "")),
            };
          })
        : null;
    const difficulty = ((): QuestionDraft["difficulty"] => {
      const d = String(q["difficulty"] ?? "medium").toLowerCase();
      return d === "easy" || d === "hard" ? d : "medium";
    })();
    const points = Array.isArray(q["answer_points"])
      ? (q["answer_points"] as unknown[]).map((p) => String(p))
      : null;
    const marksRaw = Number(q["marks"]);
    return {
      question_text: String(q["question_text"] ?? "").trim(),
      question_type: type,
      options,
      correct_answer: q["correct_answer"] != null ? String(q["correct_answer"]) : null,
      expected_answer: q["expected_answer"] != null ? String(q["expected_answer"]) : null,
      answer_points: type === "long" ? points : null,
      explanation: q["explanation"] != null ? String(q["explanation"]) : null,
      difficulty,
      topic: q["topic"] != null ? String(q["topic"]) : null,
      marks: Number.isFinite(marksRaw) && marksRaw > 0 ? marksRaw : type === "long" ? 5 : type === "short" ? 2 : 1,
    };
  }).filter((q) => q.question_text.length > 0);
}
