import { z } from "zod";
import { env } from "../../config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";

const suggestionCategorySchema = z.enum(["date", "restaurant", "activity", "gift", "trip"]);
const groqSuggestionSchema = z.object({
  category: suggestionCategorySchema,
  title: z.string().min(3).max(120),
  message: z.string().min(10).max(350),
});

const groqResponseSchema = z.object({
  suggestions: z.array(groqSuggestionSchema).min(5).max(12),
});

const PROMPT_TEMPLATE = `Eres un asistente para recomendaciones de pareja.\nGenera sugerencias variadas basadas en el contexto del usuario.\nResponde SOLO en JSON válido con esta forma exacta: {\"suggestions\":[{\"category\":\"date|restaurant|activity|gift|trip\",\"title\":\"...\",\"message\":\"...\"}]}\nDebe devolver entre 8 y 10 sugerencias.\nTitulo corto (max 120 chars).\nMensaje claro y accionable (max 350 chars).\nNo uses markdown ni texto fuera del JSON.\n\nContexto del usuario:\n{{USER_CONTEXT}}`;

function extractJsonPayload(rawText: string) {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) {
    return codeFenceMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  throw new HttpError(502, "Model response did not include valid JSON.");
}

function buildPrompt(userContext: string) {
  return PROMPT_TEMPLATE.replace("{{USER_CONTEXT}}", userContext);
}

export async function generateGroqSuggestions(context: string) {
  if (!env.GROQ_API_KEY || !env.GROQ_API_URL) {
    throw new HttpError(503, "Missing GROQ_API_KEY or GROQ_API_URL in environment.");
  }

  const prompt = buildPrompt(context);

  // Generic request shape: POST to GROQ_API_URL with { prompt } using Bearer key.
  // This implementation is intentionally generic: adapt headers/body to the
  // concrete Groq API contract you plan to use (some providers use model path
  // in the URL, others in the body). The code below attempts to read common
  // response shapes (text, output, choices[0].text, result) and extract JSON.

  const endpoint = env.GROQ_API_URL.replace(/\/+$/g, "");
  const url = endpoint.endsWith("/responses") ? endpoint : `${endpoint}/responses`;
  const body = JSON.stringify({ model: env.GROQ_MODEL ?? "openai/gpt-oss-20b", input: prompt });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    if (resp.status === 429) {
      throw new HttpError(429, "Groq quota exceeded or rate limited.");
    }
    throw new HttpError(502, `Groq request failed (${resp.status}): ${text}`);
  }

  const payload = await resp.json().catch(async () => {
    // If not JSON, try raw text
    const raw = await resp.text();
    return { raw } as unknown;
  });

  // Try several locations where text might live
  const rawText:
    | string
    | undefined =
    (typeof payload === "string" && payload) ||
    // common shapes
    (payload && (payload.output || payload.text || payload.result || payload.raw)) ||
    (payload && payload.choices && payload.choices[0] && payload.choices[0].text) ||
    (payload && payload.choices && payload.choices[0] && payload.choices[0].message?.content) ||
    undefined;

  if (!rawText) {
    throw new HttpError(502, "Groq returned an unrecognized response shape.");
  }

  const jsonText = extractJsonPayload(rawText);

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(jsonText);
  } catch {
    throw new HttpError(502, "Groq returned invalid JSON.");
  }

  const parsed = groqResponseSchema.safeParse(parsedPayload);
  if (!parsed.success) {
    throw new HttpError(502, "Groq response did not match expected suggestion format.");
  }

  return parsed.data.suggestions;
}
