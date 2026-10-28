import "./env.js";
import { Type } from "@google/genai";
import { FIELDS } from "./fields.js";
import { executeScorecardExtraction } from "./providers/index.js";

const fieldSchema = {
  type: Type.OBJECT,
  nullable: true,
  properties: {
    value: { type: Type.STRING, description: "Plain-language answer" },
    page: { type: Type.INTEGER, description: "1-based page number" },
    clause: { type: Type.STRING, description: "Exact verbatim text copied from the policy" },
    confidence: { type: Type.STRING, enum: ["high", "medium", "low"] },
  },
  required: ["value", "page", "clause", "confidence"],
};

const schema = {
  type: Type.OBJECT,
  properties: Object.fromEntries(Object.keys(FIELDS).map((k) => [k, fieldSchema])),
};

/**
 * Extracts scorecard fields from document pages using the provider abstraction layer.
 * One policy = one LLM call whenever the text fits the context.
 */
export async function extractScorecard(pages, options = {}) {
  const totalChars = pages.join("").length;

  const doc = pages.map((t, i) => `[[PAGE ${i + 1}]]\n${t}`).join("\n\n");
  const fieldList = Object.entries(FIELDS).map(([k, d]) => `- ${k}: ${d}`).join("\n");

  const prompt = `You extract facts from an Indian health insurance policy.

RULES:
- Use ONLY the policy text below. Never use outside knowledge.
- "clause" must be copied VERBATIM from the policy (max 300 characters). Do not paraphrase it.
- "page" must be the page where that clause appears.
- "value" is a short plain-language explanation a non-expert can understand.
- If a field is not clearly stated, return null for it. Do not guess.

FIELDS:
${fieldList}

POLICY TEXT:
${doc}`;

  const res = await executeScorecardExtraction({
    prompt,
    schema,
    pages,
    options,
  });

  console.log(
    `[Scorecard] Request completed | Provider: ${res.provider} | Model: ${res.model} | Cached: ${res.cached} | Calls used: ${res.calls_used}`
  );

  const scorecard = {
    ...res.data,
    _meta: {
      provider: res.provider,
      model: res.model,
      cached: res.cached,
      calls_used: res.calls_used,
      totalPages: pages.length,
      totalChars,
    },
  };

  return scorecard;
}
