const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

export interface PlanInput {
  instructions: string;
  classGroup?: string | null;
  bookName?: string | null;
  rangeLabel?: string | null;
  chapters?: string[] | null;
  patternBrief?: string | null;
  language: string;
  counts: { mcq: number; short: number; long: number };
}

export type { PaperPlan } from "@/types/plan";

const SHAPE = `{"summary":string,"sections":string[],"recommendations":string[],"patch":{"counts":{"mcq":number,"short":number,"long":number}|null,"attempts":{"mcq":number,"short":number,"long":number}|null,"language":"english"|"urdu"|"mixed"|null,"wantDiagrams":boolean|null,"longParts":boolean|null,"statements":boolean|null,"composition":string[]|null,"translation":"urdu-to-english"|"english-to-urdu"|"both"|null}}`;

function prompt(input: PlanInput) {
  return [
    "You are an expert Pakistani board exam paper setter. A teacher is about to generate a paper.",
    "Read their special instructions and the paper context, then propose the BEST approach for this paper.",
    input.classGroup ? `Class / Group: ${input.classGroup}` : "",
    input.bookName ? `Book / Subject: ${input.bookName}` : "",
    input.rangeLabel ? `Range: ${input.rangeLabel}` : "",
    input.chapters?.length ? `Chapters: ${input.chapters.join("; ")}` : "",
    `Current language: ${input.language}`,
    `Current counts: ${input.counts.mcq} MCQ, ${input.counts.short} short, ${input.counts.long} long`,
    input.patternBrief ? `Board pattern:\n${input.patternBrief}` : "",
    input.instructions
      ? `TEACHER'S SPECIAL INSTRUCTIONS:\n${input.instructions}`
      : "The teacher gave no special instructions — suggest the ideal board-style setup for this book.",
    "Rules:",
    "- summary: 2-3 short sentences in the teacher's own language style (Roman Urdu is fine if they wrote Roman Urdu), describing exactly the paper you will build.",
    "- sections: one line per section with question count and marks.",
    "- recommendations: 2-4 short, practical improvements the teacher may not have thought of.",
    "- patch: only fields you are confident about; use null for the rest. composition keys may be: letter, application, story, essay, dialogue, precis, comprehension, conceptual, translation, tashreeh, khulasa, markazi, kahani, khat, mukalma, mazmoon.",
    "- For Urdu, Islamiat or Mutalia Pakistan books set language to \"urdu\".",
    `Return ONLY JSON in this shape: ${SHAPE}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

function counts(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  return { mcq: num(o["mcq"]), short: num(o["short"]), long: num(o["long"]) };
}

function strings(value: unknown, limit = 6) {
  return Array.isArray(value)
    ? value.map((v) => String(v).trim()).filter(Boolean).slice(0, limit)
    : [];
}

function parse(raw: string): PaperPlan {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned) as Record<
    string,
    unknown
  >;
  const patch = (json["patch"] && typeof json["patch"] === "object"
    ? (json["patch"] as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const bool = (v: unknown) => (typeof v === "boolean" ? v : null);
  const lang = String(patch["language"] ?? "");
  const translation = String(patch["translation"] ?? "");

  return {
    summary: String(json["summary"] ?? "").trim(),
    sections: strings(json["sections"], 8),
    recommendations: strings(json["recommendations"], 5),
    patch: {
      counts: counts(patch["counts"]),
      attempts: counts(patch["attempts"]),
      language: ["english", "urdu", "mixed"].includes(lang) ? lang : null,
      wantDiagrams: bool(patch["wantDiagrams"]),
      longParts: bool(patch["longParts"]),
      statements: bool(patch["statements"]),
      composition: strings(patch["composition"], 8).length ? strings(patch["composition"], 8) : null,
      translation: ["urdu-to-english", "english-to-urdu", "both"].includes(translation)
        ? translation
        : null,
    },
  };
}

export async function requestPaperPlan(input: PlanInput): Promise<PaperPlan> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt(input) }],
      response_format: { type: "json_object" as const },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
    const detail = await res.text().catch(() => "");
    throw new Error(`Could not prepare the suggestion: ${detail.slice(0, 160)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const plan = parse(json.choices?.[0]?.message?.content ?? "");
  if (!plan.summary && !plan.sections.length)
    throw new Error("AI could not read these instructions. Please rephrase them and try again.");
  return plan;
}
