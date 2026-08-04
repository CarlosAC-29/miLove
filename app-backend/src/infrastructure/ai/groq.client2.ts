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

const PROMPT_TEMPLATE = `Eres un asistente para recomendaciones de pareja.
DEVUELVE SOLO UN UNICO JSON VÁLIDO y NADA MÁS. RESPUESTA EXACTA Y SIN EXPLICACIONES.
Formato exacto:
{"suggestions":[{"category":"date|restaurant|activity|gift|trip","title":"...","message":"..."}]}
- Devuelve entre 8 y 10 sugerencias.
- Título corto (máx. 120 caracteres).
- Mensaje claro y accionable (máx. 350 caracteres).
- No uses markdown, listas numeradas, ni texto fuera del JSON.

Contexto del usuario:
{{USER_CONTEXT}}`;

function extractJsonPayload(rawText: string) {
  const trimmed = rawText.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) return codeFenceMatch[1].trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1);

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
  const endpoint = env.GROQ_API_URL.replace(/\/+$/g, "");
  const url = endpoint.endsWith("/responses") ? endpoint : `${endpoint}/responses`;
  const model = env.GROQ_MODEL ?? "openai/gpt-oss-20b";

  const body = JSON.stringify({ model, input: prompt });

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
    if (resp.status === 429) throw new HttpError(429, "Groq quota exceeded or rate limited.");
    throw new HttpError(502, `Groq request failed (${resp.status}): ${text}`);
  }

  const payload = await resp.json().catch(async () => {
    const raw = await resp.text();
    return { raw } as unknown;
  });

  const rawTextAny: unknown =
    (typeof payload === "string" && payload) ||
    (payload && (payload.output_text || payload.output || payload.text || payload.result || payload.raw)) ||
    (payload && payload.output && payload.output[0] && payload.output[0].content && payload.output[0].content[0] && payload.output[0].content[0].text) ||
    (payload && payload.choices && payload.choices[0] && payload.choices[0].text) ||
    undefined;

  if (!rawTextAny) throw new HttpError(502, "Groq returned an unrecognized response shape.");

  function normalizeToString(value: unknown): string {
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(normalizeToString).filter(Boolean).join(" ");
    if (value && typeof value === "object") {
      try {
        // Try to find nested text fields
        const obj = value as Record<string, unknown>;
        const candidates = [
          obj.output_text,
          obj.text,
          obj.result,
          obj.raw,
          obj.content,
          obj.message,
        ];
        for (const c of candidates) {
          if (typeof c === "string") return c;
          if (Array.isArray(c)) {
            const joined = normalizeToString(c);
            if (joined) return joined;
          }
        }
        // fallback to JSON
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value ?? "");
  }

  const rawText = normalizeToString(rawTextAny);

  if (!rawText) throw new HttpError(502, "Groq returned an empty response.");

  const jsonText = extractJsonPayload(rawText);

  console.log("Groq raw response:", rawText);

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(jsonText);

  } catch {
    throw new HttpError(502, "Groq returned invalid JSON.");
  }

  const parsed = groqResponseSchema.safeParse(parsedPayload);
  if (!parsed.success) throw new HttpError(502, "Groq response did not match expected suggestion format.");

  return parsed.data.suggestions;
}
