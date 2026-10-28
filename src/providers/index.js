import { geminiProvider } from "./gemini.js";
import { groqProvider, ollamaProvider } from "./openaiCompat.js";
import { getFromCache, saveToCache } from "../cache.js";
import { FIELDS } from "../fields.js";

const PROVIDER_REGISTRY = {
  gemini: geminiProvider,
  groq: groqProvider,
  ollama: ollamaProvider,
};

/**
 * Parses PROVIDERS from .env into an ordered list of provider instances
 */
export function getConfiguredProviders() {
  const envProviders = (process.env.PROVIDERS || "gemini,groq,ollama")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const list = [];
  for (const name of envProviders) {
    if (PROVIDER_REGISTRY[name]) {
      list.push(PROVIDER_REGISTRY[name]);
    } else {
      console.warn(`[Providers] Unknown provider '${name}' in PROVIDERS list, skipping.`);
    }
  }

  if (list.length === 0) {
    list.push(geminiProvider);
  }

  return list;
}

/**
 * Checks whether an error is caused by daily quota exhaustion (which should not be retried)
 */
export function isDailyQuotaExhausted(err) {
  if (!err) return false;
  const status = err.status || err.statusCode || (typeof err.code === "number" ? err.code : 0);
  const msg = (String(err.message || "") + " " + String(err.body || "")).toLowerCase();

  if (status === 429) {
    // If it's specifically a per-minute rate limit (RPM/TPM) and doesn't mention daily/day, it's transient
    if ((msg.includes("requestsperminute") || msg.includes("rpm") || msg.includes("tpm")) &&
        !msg.includes("perday") && !msg.includes("daily")) {
      return false;
    }

    if (
      msg.includes("perday") ||
      msg.includes("daily") ||
      msg.includes("generaterequestsperday") ||
      msg.includes("generatecontentrequestsperday") ||
      msg.includes("insufficient_quota") ||
      msg.includes("exceeded your current quota") ||
      msg.includes("free tier") ||
      msg.includes("quota exceeded") ||
      msg.includes("resource_exhausted")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Normalizes any provider's output into a uniform { [fieldKey]: { value, page, clause, confidence } | null }
 */
export function normalizeScorecardRaw(raw) {
  if (!raw || typeof raw !== "object") {
    raw = {};
  }

  if (raw.scorecard && typeof raw.scorecard === "object") raw = raw.scorecard;
  else if (raw.result && typeof raw.result === "object") raw = raw.result;

  const normalized = {};

  for (const key of Object.keys(FIELDS)) {
    const item = raw[key];
    if (!item || typeof item !== "object") {
      normalized[key] = null;
      continue;
    }

    const value = typeof item.value === "string" ? item.value.trim() : "";
    const clause = typeof item.clause === "string" ? item.clause.trim() : "";

    let page = null;
    if (typeof item.page === "number" && !isNaN(item.page)) {
      page = Math.floor(item.page);
    } else if (typeof item.page === "string") {
      const match = item.page.match(/\d+/);
      if (match) page = parseInt(match[0], 10);
    }

    let confidence = "medium";
    if (typeof item.confidence === "string") {
      const c = item.confidence.toLowerCase().trim();
      if (["high", "medium", "low"].includes(c)) {
        confidence = c;
      }
    }

    if (!value || !clause || page === null) {
      normalized[key] = null;
    } else {
      normalized[key] = {
        value,
        page,
        clause,
        confidence,
      };
    }
  }

  return normalized;
}

/**
 * Executes JSON extraction through the provider layer with response caching,
 * exponential backoff retries, and automatic multi-provider fallback.
 */
export async function executeScorecardExtraction({ prompt, schema, pages, options = {} }) {
  const providers = getConfiguredProviders();
  const providerErrors = [];

  for (let pIdx = 0; pIdx < providers.length; pIdx++) {
    const provider = providers[pIdx];
    const model = provider.getModel();

    // 1. Response Cache: SHA-256 of pages + provider + model + FIELDS + PROMPT_VERSION
    const cachedEntry = getFromCache({ pages, provider: provider.name, model });
    if (cachedEntry) {
      console.log(`[Cache HIT] Retrieved from disk cache: ${provider.name} (${model}) [0 API calls]`);
      const normalized = normalizeScorecardRaw(cachedEntry.raw);
      return {
        data: normalized,
        provider: provider.name,
        model,
        cached: true,
        calls_used: 0,
      };
    }

    // Check if evaluation run reached --max-calls limit
    if (options.maxCalls !== undefined && options.currentCallsUsed !== undefined) {
      if (options.currentCallsUsed >= options.maxCalls) {
        const capErr = new Error(`Max API calls limit (--max-calls ${options.maxCalls}) reached.`);
        capErr.status = 429;
        throw capErr;
      }
    }

    console.log(`[Providers] Invoking ${provider.name} (${model})...`);

    // 2. Retry loop: max 3 retries on 429 (transient rate limit) and 503 (service unavailable)
    const maxRetries = 3;
    let callSucceeded = false;
    let rawOutput = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        rawOutput = await provider.generateJSON({ prompt, schema, model });
        callSucceeded = true;
        break;
      } catch (err) {
        const status = err.status || err.statusCode || (typeof err.code === "number" ? err.code : 500);
        const msg = err.message || String(err);

        // Daily quota exhaustion: DO NOT retry, fall through immediately
        if (isDailyQuotaExhausted(err)) {
          console.warn(`[Providers] ${provider.name} (${model}) DAILY QUOTA EXHAUSTED (${status}): ${msg}. Immediately falling to next provider...`);
          providerErrors.push({
            provider: provider.name,
            model,
            status,
            error: msg,
            dailyQuota: true,
            retryAfter: err.retryAfter || "Daily quota resets at 00:00 UTC",
          });
          break; // break retry loop to move to next provider in PROVIDERS
        }

        // Retryable: 429 (transient rate limit) or 503
        const isRetryable = status === 429 || status === 503;
        if (isRetryable && attempt <= maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
          console.warn(`[Providers] ${provider.name} returned HTTP ${status}. Retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        // Non-retryable error (e.g. 401 invalid key, 400 bad request) or retries exhausted
        console.warn(`[Providers] ${provider.name} (${model}) failed (${status}): ${msg}. Falling back to next provider...`);
        providerErrors.push({
          provider: provider.name,
          model,
          status,
          error: msg,
          dailyQuota: false,
          retryAfter: err.retryAfter || null,
        });
        break; // break retry loop to move to next provider
      }
    }

    if (callSucceeded && rawOutput) {
      saveToCache({ pages, provider: provider.name, model, raw: rawOutput });
      const normalized = normalizeScorecardRaw(rawOutput);
      return {
        data: normalized,
        provider: provider.name,
        model,
        cached: false,
        calls_used: 1,
      };
    }
  }

  // All providers failed: return clear error with real messages and retry time
  const errorDetails = providerErrors
    .map((e) => {
      const retryTime = e.retryAfter ? ` [Retry hint: ${e.retryAfter}]` : "";
      return `• ${e.provider} (${e.model}): ${e.error}${retryTime}`;
    })
    .join("\n");

  const combinedError = new Error(
    `All configured LLM providers failed:\n${errorDetails}\nPlease check your API keys or quota.`
  );
  combinedError.status = 503;
  combinedError.providerErrors = providerErrors;
  throw combinedError;
}
