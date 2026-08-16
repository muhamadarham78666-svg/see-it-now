export interface SolveAttachment {
  name: string;
  mime: string;
  dataUrl?: string | null;
  text?: string | null;
}

export interface SolveSettings {
  subjectArea: "physics" | "math";
  language: string;
  detail: "concise" | "detailed";
  topic?: string | null;
  problemCount?: number | null;
}

import type { SolvedProblem } from "@/types/solve";

export type { SolvedProblem };

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

function languageRule(lang: string) {
  if (lang === "urdu") return "Write every problem and its full solution in Urdu script only.";
  if (lang === "mixed")
    return "Write the wording in Urdu script but keep formulas, numbers and units in English/Latin script.";
  return "Write everything in clear English.";
}

export function buildSolveInstruction(settings: SolveSettings) {
  const area =
    settings.subjectArea === "physics"
      ? "physics numericals (mechanics, heat, waves, electricity, modern physics)"
      : "mathematics problems (algebra, trigonometry, calculus, geometry, statistics)";

  return [
    `You are an expert ${settings.subjectArea === "physics" ? "physics" : "mathematics"} teacher who solves ${area} for exam preparation.`,
    "Read the provided material (text, images, scans or documents). Extract EVERY numerical / problem / exercise you can find and solve each one completely.",
    settings.problemCount
      ? `Solve at most ${settings.problemCount} problems (the most important ones first).`
      : "Solve all problems you find. If the material contains no explicit problems, create and solve 5 representative problems from the given topic.",
    "For each problem: list the given data with units, state the formula used, then give a clear numbered step-by-step working with substitution of values, and finally the exact final answer with correct units and sensible rounding.",
    settings.detail === "detailed"
      ? "Working must be detailed: explain each step in one short sentence before the mathematics."
      : "Keep steps short and mathematical, no extra commentary.",
    "Use plain-text mathematics (e.g. v = u + a*t, x^2, sqrt(2), 3.0 x 10^8 m/s). Never use LaTeX or markdown.",
    languageRule(settings.language),
    settings.topic ? `Topic / chapter: ${settings.topic}.` : "",
    "Double-check all arithmetic before answering; the final answer must be correct.",
    'Return ONLY JSON in this shape: {"problems":[{"problem_text":string,"given":string[],"formula":string|null,"steps":string[],"final_answer":string,"units":string|null,"concept":string,"topic":string,"difficulty":"easy"|"medium"|"hard","marks":number}]}',
    "If the material is an image or scan, first read (OCR) all visible text and equations, then solve.",
  ]
    .filter(Boolean)
    .join("\n");
}

type Block = Record<string, unknown>;

export function buildSolveBlocks(
  text: string,
  attachments: SolveAttachment[],
  settings: SolveSettings,
): Block[] {
  const blocks: Block[] = [{ type: "text", text: buildSolveInstruction(settings) }];

  const textParts: string[] = [];
  if (text.trim()) textParts.push(text.trim());
  for (const a of attachments) {
    if (a.text && a.text.trim()) textParts.push(`--- ${a.name} ---\n${a.text.trim()}`);
  }
  if (textParts.length) {
    blocks.push({ type: "text", text: `PROBLEM MATERIAL:\n${textParts.join("\n\n")}` });
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

export async function requestSolutions(
  text: string,
  attachments: SolveAttachment[],
  settings: SolveSettings,
): Promise<Record<string, unknown>[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const body = {
    model: MODEL,
    messages: [{ role: "user", content: buildSolveBlocks(text, attachments, settings) }],
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
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = json.choices?.[0]?.message?.content ?? "";
      const parsed = extractJson(raw) as { problems?: Record<string, unknown>[] };
      const problems = Array.isArray(parsed?.problems) ? parsed.problems : [];
      if (!problems.length) throw new Error("AI could not find any problem to solve in this material.");
      return problems;
    }

    lastError = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error("AI rate limit reached. Please wait a moment and try again.");
    if (res.status < 500) break;
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }

  throw new Error(lastError ? `Solving failed: ${lastError.slice(0, 200)}` : "Solving failed.");
}

export function normalizeSolutions(raw: Record<string, unknown>[]): SolvedProblem[] {
  const toStrings = (v: unknown): string[] =>
    Array.isArray(v) ? v.map((x) => String(x)).filter((s) => s.trim().length > 0) : [];

  return raw
    .map((p) => {
      const difficultyRaw = String(p["difficulty"] ?? "medium").toLowerCase();
      const marksRaw = Number(p["marks"]);
      return {
        problem_text: String(p["problem_text"] ?? "").trim(),
        given: toStrings(p["given"]),
        formula: p["formula"] != null ? String(p["formula"]) : null,
        steps: toStrings(p["steps"]),
        final_answer: String(p["final_answer"] ?? "").trim(),
        units: p["units"] != null ? String(p["units"]) : null,
        concept: p["concept"] != null ? String(p["concept"]) : null,
        topic: p["topic"] != null ? String(p["topic"]) : null,
        difficulty: (difficultyRaw === "easy" || difficultyRaw === "hard"
          ? difficultyRaw
          : "medium") as SolvedProblem["difficulty"],
        marks: Number.isFinite(marksRaw) && marksRaw > 0 ? marksRaw : 5,
      };
    })
    .filter((p) => p.problem_text.length > 0);
}
