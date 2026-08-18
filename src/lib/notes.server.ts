export interface NoteAttachment {
  name: string;
  mime: string;
  dataUrl?: string | null;
  text?: string | null;
}

export interface NoteRequest {
  prompt: string;
  language: string;
  style: string;
  subject?: string | null;
  attachments: NoteAttachment[];
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

function languageRule(lang: string) {
  if (lang === "urdu") return "Write the entire note in Urdu script only.";
  if (lang === "mixed") return "Write the note in simple English with key Urdu explanations where helpful.";
  return "Write the note in clear, simple English.";
}

function styleRule(style: string) {
  if (style === "bullets") return "Use short bullet points and sub-bullets only, no long paragraphs.";
  if (style === "summary") return "Write a compact summary of the most important points.";
  if (style === "exam") return "Structure it as exam-preparation notes: definitions, key formulas, important points and likely questions.";
  return "Use clear headings followed by concise explanations.";
}

function buildInstruction(req: NoteRequest) {
  return [
    "You are an expert teacher who writes excellent study notes.",
    "Create study notes from the user's instruction and any provided material (text, documents, images or scans).",
    "If material is an image or scan, first read (OCR) all visible text, then build the notes from it.",
    styleRule(req.style),
    languageRule(req.language),
    req.subject ? `Subject: ${req.subject}.` : "",
    "Use plain text with markdown-style headings (##) and dashes for bullets. No code fences.",
    'Return ONLY JSON: {"title": string, "content": string}',
  ]
    .filter(Boolean)
    .join("\n");
}

type Block = Record<string, unknown>;

function buildBlocks(req: NoteRequest): Block[] {
  const blocks: Block[] = [{ type: "text", text: buildInstruction(req) }];
  const parts: string[] = [];
  if (req.prompt.trim()) parts.push(`INSTRUCTION:\n${req.prompt.trim()}`);
  for (const a of req.attachments) {
    if (a.text && a.text.trim()) parts.push(`--- ${a.name} ---\n${a.text.trim()}`);
  }
  if (parts.length) blocks.push({ type: "text", text: parts.join("\n\n") });

  for (const a of req.attachments) {
    if (!a.dataUrl) continue;
    if (a.mime.startsWith("image/")) {
      blocks.push({ type: "image_url", image_url: { url: a.dataUrl } });
    } else if (a.mime === "application/pdf") {
      blocks.push({ type: "file", file: { filename: a.name, file_data: a.dataUrl } });
    }
  }
  return blocks;
}

function extractJson(raw: string): { title?: unknown; content?: unknown } {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned) as { title?: unknown; content?: unknown };
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as { title?: unknown; content?: unknown };
    }
    return { title: "AI Note", content: cleaned };
  }
}

export async function requestNote(req: NoteRequest): Promise<{ title: string; content: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: buildBlocks(req) }],
      response_format: { type: "json_object" as const },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("AI rate limit reached. Please wait a moment and try again.");
    const detail = await res.text().catch(() => "");
    throw new Error(detail ? `AI note generation failed: ${detail.slice(0, 200)}` : "AI note generation failed.");
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const parsed = extractJson(json.choices?.[0]?.message?.content ?? "");
  const content = String(parsed.content ?? "").trim();
  if (!content) throw new Error("AI could not create notes from this material.");
  const title = String(parsed.title ?? "").trim() || "AI Generated Note";
  return { title, content };
}
