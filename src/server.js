import "./env.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import { pdfToPages } from "./pdf.js";
import { extractScorecard } from "./extract.js";
import { validateScorecard } from "./validate.js";
import { isCacheEnabled } from "./cache.js";

const app = express();
app.use(cors());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

function sanitizeErrorMessage(msg) {
  if (!msg) return "An unexpected error occurred.";
  let str = typeof msg === "string" ? msg : JSON.stringify(msg);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.length > 5) {
    str = str.replaceAll(geminiKey, "[REDACTED_API_KEY]");
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey.length > 5) {
    str = str.replaceAll(groqKey, "[REDACTED_API_KEY]");
  }

  str = str.replace(/key=[a-zA-Z0-9_\-\.]+/g, "key=[REDACTED]");
  return str;
}

function extractErrorInfo(e) {
  let status = e.status || e.statusCode || (typeof e.code === "number" ? e.code : 500);
  let message = e.message || "Failed to analyze policy document.";

  // Check if message is a JSON string (e.g. from an API error response)
  try {
    const parsed = JSON.parse(message);
    if (parsed.error) {
      if (parsed.error.message) message = parsed.error.message;
      if (typeof parsed.error.code === "number") status = parsed.error.code;
    } else if (parsed.message) {
      message = parsed.message;
    }
  } catch {
    // raw string message
  }

  // Ensure valid HTTP status code within standard HTTP ranges
  if (typeof status !== "number" || status < 400 || status > 599) {
    status = 500;
  }

  const sanitizedMessage = sanitizeErrorMessage(message);
  return { status, message: sanitizedMessage };
}

/**
 * Shared pipeline to process a single policy PDF buffer
 */
export async function processPolicyFile(file) {
  if (!file) throw new Error("No policy file provided");
  const pages = await pdfToPages(file.buffer);
  const totalChars = pages.join("").length;
  if (totalChars < 500) {
    const err = new Error(`Looks like a scanned PDF (${file.originalname || "policy"}). OCR not added yet.`);
    err.status = 422;
    throw err;
  }

  const raw = await extractScorecard(pages);
  const scorecard = validateScorecard(raw, pages);
  const meta = scorecard._meta || raw._meta || {};

  return {
    filename: file.originalname || "policy.pdf",
    pages: pages.length,
    scorecard,
    provider: meta.provider || "gemini",
    model: meta.model || "gemini-2.5-flash",
    cached: Boolean(meta.cached),
    calls_used: meta.calls_used ?? 1,
  };
}

// 1. Single policy analysis
app.post("/api/analyze", upload.single("policy"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload a PDF as 'policy'" });

    const result = await processPolicyFile(req.file);
    res.json({
      pages: result.pages,
      scorecard: result.scorecard,
      provider: result.provider,
      model: result.model,
      cached: result.cached,
      calls_used: result.calls_used,
    });
  } catch (e) {
    console.error("Error in /api/analyze:", e);
    const { status, message } = extractErrorInfo(e);
    res.status(status).json({
      error: message,
      status: status,
    });
  }
});

// 2. Dual policy comparison
app.post(
  "/api/compare",
  upload.fields([
    { name: "policyA", maxCount: 1 },
    { name: "policyB", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const fileA = req.files?.policyA?.[0];
      const fileB = req.files?.policyB?.[0];

      if (!fileA || !fileB) {
        return res.status(400).json({
          error: "Upload two PDF files as 'policyA' and 'policyB'",
        });
      }

      const [a, b] = await Promise.all([
        processPolicyFile(fileA),
        processPolicyFile(fileB),
      ]);

      res.json({ a, b });
    } catch (e) {
      console.error("Error in /api/compare:", e);
      const { status, message } = extractErrorInfo(e);
      res.status(status).json({
        error: message,
        status: status,
      });
    }
  }
);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const isLoaded = Boolean(apiKey);
  const keyLength = apiKey.length;
  const keyFirst4 = apiKey ? apiKey.slice(0, 4) : "NONE";
  const providers = process.env.PROVIDERS || "gemini,groq,ollama";
  const cacheStatus = isCacheEnabled() ? "ENABLED (SHA-256 disk cache)" : "BYPASSED (CACHE=off)";

  console.log("==========================================");
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`PROVIDERS priority list: ${providers}`);
  console.log(`RESPONSE CACHE: ${cacheStatus}`);
  console.log(`GEMINI_API_KEY loaded: ${isLoaded ? "YES" : "NO"} (${keyLength} chars, prefix: ${keyFirst4})`);
  console.log(`GEMINI_MODEL: ${process.env.GEMINI_MODEL || "gemini-2.5-flash"}`);
  console.log(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "CONFIGURED" : "NOT CONFIGURED"}`);
  console.log(`OLLAMA_BASE_URL: ${process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1"}`);
  console.log("==========================================");
});

export default app;
