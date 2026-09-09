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
  /** Ask the AI to add simple inline SVG diagrams where useful. */
  wantDiagrams?: boolean | null;
  /** Split long questions into parts (a) and (b). */
  longParts?: boolean | null;
  /** "Attempt any N" rules per section. */
  attempts?: { mcq: number; short: number; long: number } | null;
  /** Composition / writing items the paper must contain (letter, essay, tashreeh...). */
  composition?: string[] | null;
  /** Translation direction for English papers. */
  translation?: string | null;
  /** Print a one-line statement / mafhoom under each question. */
  statements?: boolean | null;
  /** Force the whole paper into Urdu (Urdu, Islamiat, Mutalia Pakistan books). */
  forceUrdu?: boolean | null;
}

/** Human labels for the composition keys, used in the AI brief. */
export const COMPOSITION_RULES: Record<string, string> = {
  letter: 'a letter-writing question (formal or informal letter to be written by the student)',
  application: 'an application-writing question (e.g. application to the principal)',
  story: 'a story-writing question (write a story on a given moral / outline)',
  essay: 'an essay question with a choice of at least three topics',
  dialogue: 'a dialogue / conversation writing question',
  precis: 'a precis / summary writing question with a given passage',
  comprehension: 'an unseen-passage comprehension question with sub-questions',
  conceptual:
    'extra SHORT conceptual questions that test understanding (why / how / explain briefly), not just recall',
  translation:
    'a translation question: give sentences/paragraph for Urdu → English and English → Urdu translation',
  tashreeh: 'نظم یا غزل کے اشعار کی تشریح کا سوال (اشعار دیں اور تشریح طلب کریں)',
  khulasa: 'سبق کا خلاصہ لکھنے کا سوال',
  markazi: 'نظم/سبق کا مرکزی خیال لکھنے کا سوال',
  kahani: 'کہانی نویسی کا سوال',
  khat: 'خط نویسی کا سوال',
  mukalma: 'مکالمہ نگاری کا سوال',
  mazmoon: 'مضمون نویسی کا سوال (کم از کم تین عنوانات کا انتخاب دیں)',
};


const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

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
      ? [
          "=== TEACHER'S SPECIAL INSTRUCTIONS — HIGHEST PRIORITY ===",
          settings.instructions,
          "These instructions override EVERY other rule above, including the board pattern, counts, marks, difficulty, language and section layout. Obey every single point literally. If an instruction conflicts with the pattern, follow the instruction. If an instruction asks for extra question kinds (essay, letter, story, application, translation, tashreeh, khulasa, markazi khayal, numericals, diagrams, choice questions), include them. Never ignore or partially apply an instruction.",
          "=== END OF SPECIAL INSTRUCTIONS ===",
        ].join("\n")
      : "",
    mix,
    `Difficulty: ${settings.difficulty === "mixed" ? "mix easy, medium and hard" : settings.difficulty}.`,
    `Each MCQ must have exactly ${settings.mcqOptionsCount} options labelled A, B, C... and one correct_answer holding the correct option label.`,
    languageRule(settings.language),
    settings.subject ? `Subject: ${settings.subject}.` : "",
    settings.chapter ? `Chapter: ${settings.chapter}.` : "",
    "Use the marks defined by the board pattern above when it is provided; otherwise short = 2, long = 5, MCQ = 1 mark.",
    settings.longParts
      ? 'Every long question MUST be split into two parts: set "parts":[{"label":"a","text":string,"marks":number},{"label":"b","text":string,"marks":number}] and keep question_text as the short stem/heading. Only long questions may have parts; MCQ and short questions must have "parts":null.'
      : 'Set "parts":null for every question.',
    settings.attempts
      ? `The paper is optional-choice: ${[
          settings.attempts.mcq ? `MCQ section: attempt any ${settings.attempts.mcq}` : "",
          settings.attempts.short ? `short section: attempt any ${settings.attempts.short}` : "",
          settings.attempts.long ? `long section: attempt any ${settings.attempts.long}` : "",
        ]
          .filter(Boolean)
          .join(", ")}. Generate the FULL number of questions requested so the student has real choice.`
      : "",
    settings.wantDiagrams
      ? 'Where a diagram, figure, circuit, graph or geometric shape genuinely helps, add "diagram_svg": a small self-contained inline SVG string (root <svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg">, only path/line/circle/rect/polygon/text/ellipse elements, stroke="#111" fill="none", no scripts, no external images, no CSS) plus "diagram_note": a one-line caption. Otherwise use null for both.'
      : 'Set "diagram_svg":null and "diagram_note":null.',
    settings.composition && settings.composition.length
      ? `The paper MUST also contain these writing / composition items (put each one as a "long" question unless it is clearly a short item, and set "category" to the key given in brackets):\n${settings.composition
          .map((key) => `- [${key}] ${COMPOSITION_RULES[key] ?? key}`)
          .join("\n")}`
      : "",
    settings.translation
      ? settings.translation === "urdu-to-english"
        ? "Translation question: give an Urdu paragraph/sentences and ask the student to translate them into English."
        : settings.translation === "english-to-urdu"
          ? "Translation question: give an English paragraph/sentences and ask the student to translate them into Urdu."
          : "Translation question: give BOTH an Urdu → English part and an English → Urdu part, and let the student choose which one to attempt."
      : "",
    settings.statements
      ? 'For every question add "statement": one short line (same language as the question) explaining in simple words what the student has to do / the sense (مفہوم) of the question. Keep it under 18 words.'
      : 'Set "statement":null.',
    settings.forceUrdu
      ? "This is an Urdu-medium paper: EVERY question, option, part, statement, topic and answer must be written in Urdu script only. Do not use a single English sentence."
      : "",
    'NEVER write question numbers, "Q1", "Question 3", "(i)", "1." or section headings inside question_text, parts or options — numbering is added by the app for each section separately.',
    'Set "category" to a short key when the question is a special item (letter, application, story, essay, dialogue, precis, comprehension, translation, tashreeh, khulasa, markazi, kahani, khat, mukalma, mazmoon, numerical, conceptual); otherwise null.',
    'Return ONLY JSON in this shape: {"questions":[{"question_text":string,"question_type":"mcq"|"short"|"long","options":[{"label":"A","text":string}]|null,"correct_answer":string|null,"expected_answer":string|null,"answer_points":string[]|null,"parts":[{"label":"a","text":string,"marks":number}]|null,"diagram_svg":string|null,"diagram_note":string|null,"statement":string|null,"category":string|null,"explanation":string,"difficulty":"easy"|"medium"|"hard","topic":string,"marks":number}]}',
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

/** Finds a question array anywhere in the parsed JSON. */
function pickQuestions(parsed: unknown): Record<string, unknown>[] {
  const isQuestionLike = (v: unknown) =>
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((i) => typeof i === "object" && i !== null) &&
    (v as Record<string, unknown>[]).some(
      (i) => "question_text" in i || "question" in i || "text" in i,
    );

  if (isQuestionLike(parsed)) return parsed as Record<string, unknown>[];
  if (typeof parsed !== "object" || parsed === null) return [];
  const obj = parsed as Record<string, unknown>;
  for (const key of ["questions", "items", "data", "paper", "result", "output"]) {
    const v = obj[key];
    if (isQuestionLike(v)) return v as Record<string, unknown>[];
    if (v && typeof v === "object") {
      const nested = pickQuestions(v);
      if (nested.length) return nested;
    }
  }
  for (const v of Object.values(obj)) {
    if (isQuestionLike(v)) return v as Record<string, unknown>[];
  }
  return [];
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
  let sawEmpty = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        choices?: { message?: { content?: string }; finish_reason?: string }[];
      };
      const raw = json.choices?.[0]?.message?.content ?? "";
      let questions: Record<string, unknown>[] = [];
      try {
        questions = pickQuestions(extractJson(raw));
      } catch {
        questions = [];
      }
      if (questions.length) return questions;
      // Empty or unreadable reply: retry with a stricter nudge before failing.
      sawEmpty = true;
      console.error("[generate] empty AI reply", {
        attempt,
        finish_reason: json.choices?.[0]?.finish_reason,
        preview: raw.slice(0, 400),
      });
      body.messages = [
        {
          role: "user",
          content: [
            ...buildContentBlocks(text, attachments, settings),
            {
              type: "text",
              text: 'Your previous answer was empty or invalid. Reply with ONLY the JSON object {"questions":[...]} and at least one question. No prose, no markdown fences.',
            },
          ],
        },
      ];
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      continue;
    }

    lastError = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error("AI rate limit reached. Please wait a moment and try again.");
    if (res.status === 402 || res.status === 403)
      throw new Error(`AI is unavailable: ${lastError.slice(0, 200)}`);
    if (res.status < 500) break;
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }

  if (sawEmpty)
    throw new Error(
      "AI could not create questions from this material. Try fewer questions, a smaller file, or add clearer study material.",
    );

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
  parts: { label: string; text: string; marks: number }[] | null;
  diagram_svg: string | null;
  diagram_note: string | null;
  statement: string | null;
  category: string | null;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  topic: string | null;
  marks: number;
}

/** Keeps only safe, self-contained SVG markup. */
export function sanitizeSvg(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const svg = input.trim();
  if (!svg.startsWith("<svg") || !svg.includes("</svg>")) return null;
  if (/<script|javascript:|<foreignObject|<image|xlink:href|\son\w+\s*=/i.test(svg)) return null;
  return svg.length > 20000 ? null : svg;
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
      parts:
        type === "long" && Array.isArray(q["parts"])
          ? (q["parts"] as unknown[])
              .map((p, i) => {
                const obj = (typeof p === "object" && p !== null ? p : {}) as Record<string, unknown>;
                const m = Number(obj["marks"]);
                return {
                  label: String(obj["label"] ?? (i === 0 ? "a" : "b")),
                  text: String(obj["text"] ?? "").trim(),
                  marks: Number.isFinite(m) && m > 0 ? m : 0,
                };
              })
              .filter((p) => p.text.length > 0)
          : null,
      diagram_svg: sanitizeSvg(q["diagram_svg"]),
      diagram_note: q["diagram_note"] != null ? String(q["diagram_note"]) : null,
      explanation: q["explanation"] != null ? String(q["explanation"]) : null,

      difficulty,
      topic: q["topic"] != null ? String(q["topic"]) : null,
      marks: Number.isFinite(marksRaw) && marksRaw > 0 ? marksRaw : type === "long" ? 5 : type === "short" ? 2 : 1,
    };
  }).filter((q) => q.question_text.length > 0);
}
