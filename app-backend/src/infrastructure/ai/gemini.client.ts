import { z } from "zod";
import { env } from "../../config/env.js";
import { HttpError } from "../../shared/errors/http-error.js";

const suggestionCategorySchema = z.enum(["date", "restaurant", "activity", "gift", "trip"]);
const geminiSuggestionSchema = z.object({
  category: suggestionCategorySchema,
  title: z.string().min(3).max(120),
  message: z.string().min(10).max(350),
});

const geminiResponseSchema = z.object({
  suggestions: z.array(geminiSuggestionSchema).min(5).max(12),
});

const PROMPT_TEMPLATE = `Eres un asistente para recomendaciones de pareja.
Genera sugerencias variadas basadas en el contexto del usuario.
Responde SOLO en JSON válido con esta forma exacta: {"suggestions":[{"category":"date|restaurant|activity|gift|trip","title":"...","message":"..."}]}
Debe devolver entre 8 y 10 sugerencias.
Titulo corto (max 120 chars).
Mensaje claro y accionable (max 350 chars).
No uses markdown ni texto fuera del JSON.

Contexto del usuario:
{{USER_CONTEXT}}`;

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

  throw new HttpError(502, "Gemini response did not include valid JSON.");
}

function buildPrompt(userContext: string) {
  return PROMPT_TEMPLATE.replace("{{USER_CONTEXT}}", userContext);
}

function toModelPath(model: string) {
  const normalized = model.trim();
  return normalized.startsWith("models/") ? normalized : `models/${normalized}`;
}

async function requestGenerateContent(model: string, prompt: string, apiKey: string) {
  const modelPath = toModelPath(model);
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          responseMimeType: "application/json",
        },
      }),
    },
  );
}

async function listGenerateContentModels(apiKey: string): Promise<string[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as {
    models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
  };
  return (
    payload.models
      ?.filter((model) => model.name && model.supportedGenerationMethods?.includes("generateContent"))
      .map((model) => model.name!) ?? []
  );
}

function hasModelNotFoundError(bodyText: string) {
  return (
    bodyText.includes('"status": "NOT_FOUND"') ||
    bodyText.includes("is not found") ||
    bodyText.includes("no longer available")
  );
}

function hasQuotaError(bodyText: string) {
  return bodyText.includes('"status": "RESOURCE_EXHAUSTED"') || bodyText.includes("Quota exceeded");
}

export async function generateGeminiSuggestions(context: string) {
  if (!env.GEMINI_API_KEY) {
    throw new HttpError(503, "Missing GEMINI_API_KEY in environment.");
  }
  const prompt = buildPrompt(context);

  const knownPreferredModels = [
    "models/gemini-2.5-flash-lite",
    "models/gemini-2.0-flash",
    "models/gemini-2.0-flash-lite",
    "models/gemini-1.5-flash",
  ];
  const availableModels = await listGenerateContentModels(env.GEMINI_API_KEY);
  const candidates = Array.from(
    new Set([toModelPath(env.GEMINI_MODEL), ...knownPreferredModels, ...availableModels]),
  );

  let response: Response | null = null;
  let lastErrorMessage = "";

  for (const model of candidates) {
    const attempt = await requestGenerateContent(model, prompt, env.GEMINI_API_KEY);
    if (attempt.ok) {
      response = attempt;
      break;
    }

    const failedBody = await attempt.text();
    lastErrorMessage = `Gemini request failed (${attempt.status}) with ${model}: ${failedBody}`;

    if (attempt.status === 429 || hasQuotaError(failedBody)) {
      throw new HttpError(
        429,
        "Gemini quota exceeded. Revisa tu plan/facturacion y cuotas del proyecto en Google AI Studio.",
      );
    }

    if (attempt.status === 404 && hasModelNotFoundError(failedBody)) {
      continue;
    }
    if (attempt.status === 400 && failedBody.includes("not supported for generateContent")) {
      continue;
    }

    throw new HttpError(502, lastErrorMessage);
  }

  if (!response) {
    throw new HttpError(
      502,
      lastErrorMessage || "Unable to generate suggestions with currently available Gemini models.",
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new HttpError(502, "Gemini returned an empty response.");
  }

  const jsonText = extractJsonPayload(rawText);

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(jsonText);
  } catch {
    throw new HttpError(502, "Gemini returned invalid JSON.");
  }

  const parsed = geminiResponseSchema.safeParse(parsedPayload);
  if (!parsed.success) {
    throw new HttpError(502, "Gemini response did not match expected suggestion format.");
  }

  return parsed.data.suggestions;
}
