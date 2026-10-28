import "./env.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import { pdfToPages } from "./pdf.js";
import { extractScorecard } from "./extract.js";
import { validateScorecard } from "./validate.js";

const app = express();
app.use(cors());
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

function sanitizeErrorMessage(msg, apiKey) {
  if (!msg) return "An unexpected error occurred.";
  let str = typeof msg === "string" ? msg : JSON.stringify(msg);
  if (apiKey && apiKey.length > 5) {
    str = str.replaceAll(apiKey, "[REDACTED_API_KEY]");
  }
  str = str.replace(/key=[a-zA-Z0-9_\-\.]+/g, "key=[REDACTED]");
  return str;
}

function extractErrorInfo(e) {
  let status = e.status || e.statusCode || (typeof e.code === "number" ? e.code : 500);
  let message = e.message || "Failed to analyze policy document.";

  // Check if message is a JSON string from Google Gemini API (e.g. {"error":{"code":503,"message":"..."}})
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

  const sanitizedMessage = sanitizeErrorMessage(message, process.env.GEMINI_API_KEY);
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
  return {
    filename: file.originalname || "policy.pdf",
    pages: pages.length,
    scorecard,
  };
}

// 1. Single policy analysis
app.post("/api/analyze", upload.single("policy"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload a PDF as 'policy'" });

    const result = await processPolicyFile(req.file);
    res.json({ pages: result.pages, scorecard: result.scorecard });
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
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  console.log("==========================================");
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`GEMINI_API_KEY loaded: ${isLoaded ? "YES" : "NO"}`);
  console.log(`GEMINI_API_KEY length: ${keyLength}`);
  console.log(`GEMINI_API_KEY first 4 chars: ${keyFirst4}`);
  console.log(`GEMINI_MODEL: ${model}`);
  console.log("==========================================");
});

export default app;
