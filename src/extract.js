import "./env.js";
import { GoogleGenAI, Type } from "@google/genai";
import { FIELDS } from "./fields.js";
import { matchClauseOnPage } from "./validate.js";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set or empty. Please verify your .env file in the project root.");
  }
  return new GoogleGenAI({ apiKey });
}

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

const LARGE_PDF_PAGE_THRESHOLD = 10;
const LARGE_PDF_CHAR_THRESHOLD = 30000;
const CHUNK_PAGE_SIZE = 8;
const CHUNK_PAGE_OVERLAP = 2;

async function extractFromDoc(doc, ai, primaryModel) {
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

  const candidateModels = Array.from(
    new Set([
      primaryModel,
      primaryModel !== "gemini-3.5-flash" ? "gemini-3.5-flash" : "gemini-3.5-flash-lite",
      "gemini-3.5-flash-lite",
    ])
  );

  let lastError;

  for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
    const currentModel = candidateModels[mIdx];
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0,
          },
        });

        return JSON.parse(res.text);
      } catch (err) {
        lastError = err;
        const msg = String(err.message || "");
        const isQuota = msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded") || err.status === 429;
        const isUnavailable = err.status === 503 || msg.includes("UNAVAILABLE");

        if ((isQuota || (isUnavailable && attempt === 2)) && mIdx < candidateModels.length - 1) {
          const nextModel = candidateModels[mIdx + 1];
          console.warn(`[Extract] Model ${currentModel} error (${err.status || "quota"}). Automatically falling back to ${nextModel}...`);
          break; // proceed to next candidate model
        }

        const statusCode = err.status || err.statusCode || (typeof err.code === "number" ? err.code : 0);
        if (attempt < 2 && (statusCode === 503 || statusCode === 429)) {
          console.warn(`Gemini API returned ${statusCode} on attempt ${attempt}. Retrying in 1.5s...`);
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
      }
    }
  }

  throw lastError;
}

/**
 * Rates a field candidate based on whether its quoted clause actually validates
 * on the document pages, and its confidence rating.
 */
function scoreCandidate(candidate, pages) {
  if (!candidate || !candidate.value || !candidate.clause) return 0;
  const { ok } = matchClauseOnPage(candidate.clause, candidate.page, pages);
  const confidenceScore = candidate.confidence === "high" ? 3 : candidate.confidence === "medium" ? 2 : 1;
  return ok ? 100 + confidenceScore * 10 : 10 + confidenceScore;
}

export async function extractScorecard(pages) {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  const totalChars = pages.join("").length;
  const isLargePdf = pages.length > LARGE_PDF_PAGE_THRESHOLD || totalChars > LARGE_PDF_CHAR_THRESHOLD;

  if (!isLargePdf) {
    const doc = pages.map((t, i) => `[[PAGE ${i + 1}]]\n${t}`).join("\n\n");
    const raw = await extractFromDoc(doc, ai, model);
    raw._meta = {
      chunkingUsed: false,
      chunksCount: 1,
      totalChars,
      totalPages: pages.length,
    };
    return raw;
  }

  // Large PDF: Chunk by page ranges with overlap
  console.log(`[Extract] Large PDF detected (${pages.length} pages, ${totalChars} chars). Chunking with overlap...`);
  const chunks = [];
  let startIdx = 0;
  while (startIdx < pages.length) {
    const endIdx = Math.min(startIdx + CHUNK_PAGE_SIZE, pages.length);
    chunks.push({ startIdx, endIdx });
    if (endIdx >= pages.length) break;
    startIdx += CHUNK_PAGE_SIZE - CHUNK_PAGE_OVERLAP;
  }

  const chunkRanges = chunks.map((c) => `Pages ${c.startIdx + 1}–${c.endIdx}`);
  console.log(`[Extract] Created ${chunks.length} chunks: ${chunkRanges.join(", ")}`);

  const merged = {};
  for (const key of Object.keys(FIELDS)) {
    merged[key] = null;
  }

  for (let i = 0; i < chunks.length; i++) {
    const { startIdx, endIdx } = chunks[i];
    console.log(`[Extract] Processing chunk ${i + 1}/${chunks.length} (${chunkRanges[i]})...`);

    const chunkDoc = pages
      .slice(startIdx, endIdx)
      .map((t, idx) => `[[PAGE ${startIdx + idx + 1}]]\n${t}`)
      .join("\n\n");

    const chunkRaw = await extractFromDoc(chunkDoc, ai, model);

    // Merge each field by keeping the highest-scoring candidate
    for (const key of Object.keys(FIELDS)) {
      const candidate = chunkRaw[key];
      if (!candidate) continue;

      const currentScore = scoreCandidate(merged[key], pages);
      const newScore = scoreCandidate(candidate, pages);

      if (newScore > currentScore) {
        merged[key] = candidate;
      }
    }

    if (i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  merged._meta = {
    chunkingUsed: true,
    chunksCount: chunks.length,
    chunkRanges,
    totalChars,
    totalPages: pages.length,
  };

  return merged;
}
