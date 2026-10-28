import { FIELDS } from "../fields.js";

/**
 * Strips markdown code blocks and parses JSON safely
 */
export function parseJSONFromText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Empty response text received from LLM");
  }
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return JSON.parse(cleaned);
}

/**
 * Factory for OpenAI-compatible /chat/completions providers (Groq, Ollama, etc.)
 */
export function createOpenAICompatProvider({
  name,
  getBaseUrl,
  getApiKey,
  getModel,
  defaultModel,
  requireKey = false,
}) {
  return {
    name,

    getModel() {
      const configured = getModel?.();
      return (configured || defaultModel).trim();
    },

    async generateJSON({ prompt, schema, model }) {
      const baseUrl = (getBaseUrl?.() || "").replace(/\/+$/, "");
      const apiKey = getApiKey?.();
      const selectedModel = (model || this.getModel()).trim();

      if (requireKey && !apiKey) {
        const err = new Error(
          `[${name}] API key is required but not set. Please set ${name.toUpperCase()}_API_KEY in .env.`
        );
        err.status = 401;
        throw err;
      }

      const fieldDescription = Object.entries(FIELDS)
        .map(([k, d]) => `  "${k}": { "value": "plain text", "page": 1, "clause": "verbatim clause", "confidence": "high"|"medium"|"low" } OR null (if not found in policy)`)
        .join("\n");

      const systemPrompt = `You are a strict data extraction system that outputs valid JSON only.
You must extract facts from the provided insurance policy according to this exact JSON schema:
{
${fieldDescription}
}

CRITICAL RULES:
- Return ONLY valid JSON matching the schema above. No commentary, no introductory text, no markdown.
- For each field, "clause" must be copied VERBATIM from the policy (max 300 characters).
- "page" must be the 1-based page number where that clause appears.
- If a field is not clearly stated in the policy text, return null for that field. Do NOT guess.`;

      const requestBody = {
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      };

      const headers = {
        "Content-Type": "application/json",
      };

      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const endpoint = `${baseUrl}/chat/completions`;

      let res;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
        });
      } catch (networkErr) {
        const err = new Error(
          `[${name}] Network connection failed to ${endpoint}: ${networkErr.message}`
        );
        err.status = 503;
        err.originalError = networkErr;
        throw err;
      }

      if (!res.ok) {
        const rawBody = await res.text().catch(() => "");
        let errorMsg = rawBody;
        let errorCode = "";

        try {
          const parsed = JSON.parse(rawBody);
          if (parsed.error?.message) errorMsg = parsed.error.message;
          if (parsed.error?.code) errorCode = parsed.error.code;
        } catch {
          // keep raw body
        }

        const err = new Error(`[${name}] API returned ${res.status}: ${errorMsg}`);
        err.status = res.status;
        err.code = errorCode;
        err.body = rawBody;

        const retryAfter = res.headers.get("retry-after");
        if (retryAfter) {
          err.retryAfter = retryAfter;
        }

        throw err;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`[${name}] Missing choices[0].message.content in API response.`);
      }

      return parseJSONFromText(content);
    },
  };
}

export const groqProvider = createOpenAICompatProvider({
  name: "groq",
  getBaseUrl: () => "https://api.groq.com/openai/v1",
  getApiKey: () => process.env.GROQ_API_KEY?.trim(),
  getModel: () => process.env.GROQ_MODEL?.trim(),
  defaultModel: "llama-3.3-70b-versatile",
  requireKey: true,
});

export const ollamaProvider = createOpenAICompatProvider({
  name: "ollama",
  getBaseUrl: () => process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434/v1",
  getApiKey: () => null,
  getModel: () => process.env.OLLAMA_MODEL?.trim(),
  defaultModel: "llama3.2",
  requireKey: false,
});
