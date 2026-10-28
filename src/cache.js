import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { FIELDS } from "./fields.js";

export const PROMPT_VERSION = "v1.0.0";

const CACHE_DIR = path.resolve(process.cwd(), "cache");

export function isCacheEnabled() {
  const val = (process.env.CACHE || "").trim().toLowerCase();
  return val !== "off" && val !== "false";
}

/**
 * Computes SHA-256 hash of (pages text + provider + model + FIELDS definition + PROMPT_VERSION)
 */
export function computeCacheHash({ pages, provider, model }) {
  const pagesText = Array.isArray(pages) ? pages.join("\n\n") : String(pages || "");
  const payload = JSON.stringify({
    pagesText,
    provider: String(provider || "").trim().toLowerCase(),
    model: String(model || "").trim().toLowerCase(),
    fields: FIELDS,
    promptVersion: PROMPT_VERSION,
  });

  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Reads raw model output from cache/<hash>.json if available
 */
export function getFromCache({ pages, provider, model }) {
  if (!isCacheEnabled()) return null;

  try {
    const hash = computeCacheHash({ pages, provider, model });
    const filePath = path.join(CACHE_DIR, `${hash}.json`);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const raw = JSON.parse(content);
      return { raw, hash };
    }
  } catch (err) {
    console.warn("[Cache] Error reading cache:", err.message);
  }

  return null;
}

/**
 * Stores raw model output in cache/<hash>.json
 */
export function saveToCache({ pages, provider, model, raw }) {
  if (!isCacheEnabled()) return;

  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const hash = computeCacheHash({ pages, provider, model });
    const filePath = path.join(CACHE_DIR, `${hash}.json`);
    fs.writeFileSync(filePath, JSON.stringify(raw, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Cache] Error saving cache entry:", err.message);
  }
}
