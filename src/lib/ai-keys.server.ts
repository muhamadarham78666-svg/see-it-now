/**
 * Multi-key AI transport.
 *
 * NSAGPT talks to Google Gemini with the API keys stored as secrets
 * `zain` through `zain5`. The keys are tried in turn: if one is exhausted,
 * rate limited or invalid, the next one is used automatically.
 *
 * Requests are sent to Gemini's native endpoint (not the OpenAI-compatible
 * one) because only the native endpoint accepts PDF / document attachments.
 * The reply is converted back into the OpenAI chat shape the app expects.
 *
 * The built-in Lovable AI gateway is used ONLY when every Gemini key is out of
 * quota or unreachable, so paid credits are not spent while the keys work.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
/** Prefer the model that reliably handles structured question batches. */
const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-flash-latest"] as const;
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const KEY_NAMES = ["zain", "zain2", "zain3", "zain4", "zain5"] as const;

/** Remembers the key that last worked so we don't retry a dead key every time. */
let cursor = 0;

/** Quota / auth / upstream problems -> try the next key. */
function rotatable(status: number): boolean {
  return (
    status === 429 || status === 401 || status === 403 || status === 402 || status === 404 || status >= 500
  );
}

/** Out of quota or unreachable everywhere -> only then spend Lovable credits. */
function exhausted(status: number): boolean {
  return status === 429 || status === 402 || status === 503 || status === 500;
}

function geminiKeys(): string[] {
  return KEY_NAMES.map((n) => process.env[n]).filter((k): k is string => !!k && k.trim().length > 0);
}

export function aiKeyCount(): number {
  return geminiKeys().length;
}

export interface AiChatOptions {
  /** Never spend Lovable credits. Used by Question Bank population jobs. */
  freeOnly?: boolean;
}

function retryAfterSeconds(response: Response): number {
  const raw = response.headers.get("retry-after");
  const seconds = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 0;
}

function freeQuotaResponse(retryAfter: number, detail: string): Response {
  return Response.json(
    {
      type: "free_quota_wait",
      retryAfter,
      message: "Free AI is resting. Saved progress is safe and filling will resume automatically.",
      detail,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

type Part = Record<string, unknown>;

function dataUrlPart(url: string, fallbackMime: string): Part | null {
  const m = /^data:([^;,]+);base64,(.+)$/i.exec(url.trim());
  if (!m) return null;
  return { inlineData: { mimeType: m[1] || fallbackMime, data: m[2] } };
}

/** Converts an OpenAI-style chat body into a Gemini `generateContent` body. */
function toGeminiBody(body: Record<string, unknown>) {
  const messages = Array.isArray(body["messages"]) ? (body["messages"] as Record<string, unknown>[]) : [];
  const contents: { role: "user" | "model"; parts: Part[] }[] = [];
  const systemParts: Part[] = [];

  for (const msg of messages) {
    const role = String(msg["role"] ?? "user");
    const raw = msg["content"];
    const parts: Part[] = [];

    if (typeof raw === "string") {
      if (raw.trim()) parts.push({ text: raw });
    } else if (Array.isArray(raw)) {
      for (const b of raw as Record<string, unknown>[]) {
        const type = String(b["type"] ?? "");
        if (type === "text") {
          const t = String(b["text"] ?? "");
          if (t.trim()) parts.push({ text: t });
        } else if (type === "image_url") {
          const url = String((b["image_url"] as Record<string, unknown> | undefined)?.["url"] ?? "");
          const p = dataUrlPart(url, "image/png");
          if (p) parts.push(p);
          else if (url) parts.push({ fileData: { fileUri: url } });
        } else if (type === "file") {
          const file = (b["file"] ?? {}) as Record<string, unknown>;
          const p = dataUrlPart(String(file["file_data"] ?? ""), "application/pdf");
          if (p) parts.push(p);
        }
      }
    }

    if (!parts.length) continue;
    if (role === "system") systemParts.push(...parts);
    else contents.push({ role: role === "assistant" ? "model" : "user", parts });
  }

  const wantsJson =
    (body["response_format"] as Record<string, unknown> | undefined)?.["type"] === "json_object";

  return {
    contents,
    ...(systemParts.length ? { systemInstruction: { parts: systemParts } } : {}),
    generationConfig: {
      ...(wantsJson ? { responseMimeType: "application/json" } : {}),
      ...(typeof body["temperature"] === "number" ? { temperature: body["temperature"] } : {}),
    },
  };
}

/** Converts a Gemini reply into the OpenAI chat-completion shape. */
function toOpenAiResponse(json: unknown): Response {
  const data = (json ?? {}) as Record<string, unknown>;
  const candidate = (Array.isArray(data["candidates"]) ? data["candidates"][0] : null) as
    | Record<string, unknown>
    | null;
  const content = (candidate?.["content"] ?? {}) as Record<string, unknown>;
  const parts = Array.isArray(content["parts"]) ? (content["parts"] as Record<string, unknown>[]) : [];
  const text = parts
    .map((p) => (typeof p["text"] === "string" ? p["text"] : ""))
    .filter(Boolean)
    .join("");

  return new Response(
    JSON.stringify({
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: String(candidate?.["finishReason"] ?? "stop").toLowerCase(),
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

/**
 * Same shape as an OpenAI chat completion call: returns a Response for the
 * first key that answers successfully, otherwise the last failure.
 */
export async function aiChatFetch(
  body: Record<string, unknown>,
  options: AiChatOptions = {},
): Promise<Response> {
  const keys = geminiKeys();
  const payload = JSON.stringify(toGeminiBody(body));

  let lastStatus = 0;
  let lastDetail = "";
  let retryAfter = 0;
  let hardStop = false;

  // Google can briefly return 503 for a larger structured request even while
  // tiny health checks pass. Use one bounded retry cycle in free-only mode so
  // a temporary busy response does not park the whole bulk job for an hour.
  const attempts: { model: string; wait: number }[] = [];
  for (const model of GEMINI_MODELS) attempts.push({ model, wait: 0 });
  for (const model of GEMINI_MODELS) attempts.push({ model, wait: 4000 });

  for (const attempt of attempts) {
    if (hardStop) break;
    const model = attempt.model;
    if (attempt.wait) await new Promise((r) => setTimeout(r, attempt.wait));
    const url = `${GEMINI_BASE}/${model}:generateContent`;
    for (let i = 0; i < keys.length; i++) {
      const index = (cursor + i) % keys.length;
      try {
        const res = await fetch(`${url}?key=${encodeURIComponent(keys[index]!)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        if (res.ok) {
          cursor = index;
          return toOpenAiResponse(await res.json());
        }
        lastStatus = res.status;
        if (res.status === 429) retryAfter = Math.max(retryAfter, retryAfterSeconds(res));
        lastDetail = await res.text().catch(() => "");
        console.error("[ai-keys]", model, "key", index + 1, "failed", res.status, lastDetail.slice(0, 160));
        if (!rotatable(res.status) && !/api[_ ]?key/i.test(lastDetail)) {
          hardStop = true;
          break;
        }
      } catch (err) {
        lastStatus = 503;
        lastDetail = err instanceof Error ? err.message : "network error";
        console.error("[ai-keys]", model, "key", index + 1, "network error", lastDetail);
      }
    }
  }

  if (options.freeOnly) {
    const hasKeys = keys.length > 0;
    const permanent = lastStatus === 400 || lastStatus === 401 || lastStatus === 403 || lastStatus === 404;
    if (!hasKeys || permanent) {
      return Response.json(
        {
          type: "free_provider_blocked",
          message: hasKeys
            ? "Free AI needs attention before Question Bank filling can continue."
            : "Add a free AI key before Question Bank filling can continue.",
        },
        { status: 403 },
      );
    }
    // Quota errors wait for Google's reset window. A pure 5xx response is a
    // short provider-busy pause and should be retried much sooner.
    const waitSeconds = retryAfter > 0 ? retryAfter : lastStatus >= 500 ? 120 : 3600;
    return freeQuotaResponse(waitSeconds, lastDetail.slice(0, 160));
  }

  // Paid backup only when the free keys are truly out of quota / unreachable.
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey && (lastStatus === 0 || exhausted(lastStatus))) {
    console.error("[ai-keys] all Gemini keys exhausted, using Lovable AI backup");
    try {
      return await fetch(LOVABLE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
        body: JSON.stringify(body),
      });
    } catch (err) {
      lastStatus = 503;
      lastDetail = err instanceof Error ? err.message : "network error";
    }
  }

  return new Response(lastDetail || "AI is unavailable right now.", {
    status: lastStatus || 503,
    headers: { "Content-Type": "text/plain" },
  });
}
