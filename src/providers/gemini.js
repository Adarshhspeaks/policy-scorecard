import { GoogleGenAI } from "@google/genai";

export const geminiProvider = {
  name: "gemini",

  getModel() {
    return (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
  },

  async generateJSON({ prompt, schema, model }) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      const err = new Error("GEMINI_API_KEY is not set or empty. Please check your .env file.");
      err.status = 401;
      throw err;
    }

    const ai = new GoogleGenAI({ apiKey });
    const selectedModel = model || this.getModel();

    const config = {
      responseMimeType: "application/json",
      temperature: 0,
    };

    if (schema) {
      config.responseSchema = schema;
    }

    try {
      const res = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config,
      });

      const text = res.text;
      if (!text) {
        throw new Error(`[Gemini] Empty response received from model ${selectedModel}`);
      }

      return JSON.parse(text);
    } catch (err) {
      // Parse detailed message and retry duration if present in Gemini ApiError
      try {
        const rawMsg = err.message || "";
        const parsed = JSON.parse(rawMsg);
        if (parsed.error) {
          if (parsed.error.message) err.message = parsed.error.message;
          const retryInfo = parsed.error.details?.find((d) => d["@type"]?.includes("RetryInfo"));
          if (retryInfo?.retryDelay) err.retryAfter = retryInfo.retryDelay;
          const match = err.message.match(/retry in ([^\.\n]+)/i);
          if (match && !err.retryAfter) err.retryAfter = match[1];
        }
      } catch {
        // keep standard error format
      }
      throw err;
    }
  },
};
