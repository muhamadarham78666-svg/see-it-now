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
    "You are an expert exam paper setter for schools and colleges.",
    "Read the provided study material (text, images, scans or documents) carefully and create exam questions strictly from that material.",
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
