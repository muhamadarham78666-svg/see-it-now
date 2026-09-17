/**
 * Multi-key AI transport.
 *
 * NSAGPT tries the Gemini API keys stored as secrets `zain`, `zain2`, `zain3`
 * in turn: if one is exhausted, rate limited or invalid, the next one is used
 * automatically. If all three fail, the built-in Lovable AI gateway is used as
 * the final fallback, so the AI features never go down.
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GEMINI_MODEL = "gemini-3.6-flash";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const KEY_NAMES = ["zain", "zain2", "zain3"] as const;

/** Remembers the key that last worked so we don't retry a dead key every time. */
let cursor = 0;

function rotatable(status: number): boolean {
  // quota / auth / model / upstream problems -> try the next key
  return status === 429 || status === 401 || status === 402 || status === 403 || status === 404 || status >= 500;
}

function geminiKeys(): string[] {
  return KEY_NAMES.map((n) => process.env[n]).filter((k): k is string => !!k && k.trim().length > 0);
}

export function aiKeyCount(): number {
  return geminiKeys().length;
}

/**
 * Same shape as `fetch(gateway, ...)`: returns a Response for the first
 * provider that answers successfully, or the last failing response.
 */
export async function aiChatFetch(body: Record<string, unknown>): Promise<Response> {
  const keys = geminiKeys();
  const geminiPayload = JSON.stringify({ ...body, model: GEMINI_MODEL });

  let lastStatus = 0;
  let lastDetail = "";

  for (let i = 0; i < keys.length; i++) {
    const index = (cursor + i) % keys.length;
    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${keys[index]}` },
        body: geminiPayload,
      });
      if (res.ok) {
        cursor = index;
        return res;
      }
      lastStatus = res.status;
      lastDetail = await res.text().catch(() => "");
      console.error("[ai-keys] key", index + 1, "failed", res.status, lastDetail.slice(0, 160));
      if (!rotatable(res.status)) break;
    } catch (err) {
      lastStatus = 503;
      lastDetail = err instanceof Error ? err.message : "network error";
      console.error("[ai-keys] key", index + 1, "network error", lastDetail);
    }
  }

  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (lovableKey) {
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
