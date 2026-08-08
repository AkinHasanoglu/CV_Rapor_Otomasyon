/**
 * AI sağlayıcıları: OpenAI ve Anthropic, sunucusuz ortam için doğrudan
 * fetch (SDK'sız) ile çağrılır. İkisi de yapılandırılmışsa OPENAI önceliklidir.
 */

export type AiProviderName = "openai" | "anthropic" | "fallback";

export function detectProvider(): AiProviderName {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "fallback";
}

async function openaiChat(system: string, user: string, jsonMode = false): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      response_format: jsonMode ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI API hatası: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function anthropicChat(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.3,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic API hatası: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
}

/** JSON çıktısını her sağlayıcıdan güvenli şekilde ayrıştırır */
export function extractJson(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("AI yapılandırılmış JSON döndüremedi.");
  }
  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
}

export async function aiChat(system: string, user: string, jsonMode = true): Promise<string> {
  const provider = detectProvider();
  if (provider === "openai") return openaiChat(system, user, jsonMode);
  if (provider === "anthropic") return anthropicChat(system, user);
  throw new Error("AI sağlayıcı yapılandırılmadı.");
}
