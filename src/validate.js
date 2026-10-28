/**
 * Advanced text normalizer for PDF extracted text and LLM generated clauses.
 * Strips unicode variations, line breaks, dehyphenates wrapped words,
 * and normalizes whitespace.
 */
export function normalizeText(text) {
  if (!text || typeof text !== "string") return "";

  return text
    // Replace unicode single quotes, backticks, prime, apostrophes with ascii '
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'")
    // Replace unicode double quotes, guillemets with ascii "
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    // Remove soft hyphens
    .replace(/\u00AD/g, "")
    // Replace unicode dashes (em-dash, en-dash, horizontal bar, minus) with ascii -
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "-")
    // Replace unicode spaces / non-breaking spaces with ascii space
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]/g, " ")
    // Remove zero-width characters
    .replace(/[\u200B\u200C\u200D]/g, "")
    // Handle line break hyphenation: e.g. "pre-\nexisting" or "in-\n patient" -> "pre-existing" / "inpatient"
    .replace(/(\b[a-zA-Z]+)-\s*(?:\r?\n)+\s*([a-zA-Z]+\b)/g, (match, p1, p2) => {
      // If common prefix like pre/post/non/sub/co, retain hyphen, else join
      const prefixes = ["pre", "post", "non", "sub", "co", "multi", "semi"];
      if (prefixes.includes(p1.toLowerCase())) {
        return `${p1}-${p2}`;
      }
      return `${p1}${p2}`;
    })
    // Lowercase
    .toLowerCase()
    // Collapse any whitespace/newlines to single space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips punctuation for token/fuzzy matching
 */
function stripPunctuation(text) {
  return text.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Checks if a significant sequence of words from clause appears in page text
 */
function matchesWordSequence(clauseNorm, pageNorm, minWords = 6) {
  const wordsClause = stripPunctuation(clauseNorm).split(" ").filter((w) => w.length > 2);
  const wordsPage = stripPunctuation(pageNorm).split(" ").filter((w) => w.length > 2);

  if (wordsClause.length < minWords) {
    return false;
  }

  // Check sliding window of word sequences
  const seqLen = Math.min(wordsClause.length, 10);
  for (let i = 0; i <= wordsClause.length - seqLen; i++) {
    const seq = wordsClause.slice(i, i + seqLen).join(" ");
    const pageText = wordsPage.join(" ");
    if (pageText.includes(seq)) {
      return true;
    }
  }

  return false;
}

/**
 * Verifies whether a clause extracted by the model exists on the cited page
 * or adjacent page, returning verification status and matching method.
 */
export function matchClauseOnPage(rawClause, pageNumber, pages) {
  if (!rawClause || typeof rawClause !== "string") {
    return { ok: false, matchMethod: "none", actualPage: pageNumber };
  }

  const clauseNorm = normalizeText(rawClause);
  if (clauseNorm.length < 10) {
    return { ok: false, matchMethod: "none", actualPage: pageNumber };
  }

  const pageIndex = pageNumber - 1;
  const rawPageText = pages[pageIndex] || "";
  const normPageText = normalizeText(rawPageText);

  // Method 1: Exact Raw Substring Match
  if (rawPageText.includes(rawClause)) {
    return { ok: true, matchMethod: "exact_raw", actualPage: pageNumber };
  }

  // Method 2: Clean Normalized Exact Match
  if (normPageText.includes(clauseNorm)) {
    return { ok: true, matchMethod: "normalized_exact", actualPage: pageNumber };
  }

  // Method 3: Clean Probe Match (first 60-80 chars)
  const probe = clauseNorm.slice(0, 80);
  if (probe.length >= 20 && normPageText.includes(probe)) {
    return { ok: true, matchMethod: "normalized_probe", actualPage: pageNumber };
  }

  // Method 4: Suffix Probe Match (last 60-80 chars)
  const suffixProbe = clauseNorm.slice(-80);
  if (suffixProbe.length >= 20 && normPageText.includes(suffixProbe)) {
    return { ok: true, matchMethod: "suffix_probe", actualPage: pageNumber };
  }

  // Method 5: Word Sequence Sliding Window Match
  if (matchesWordSequence(clauseNorm, normPageText)) {
    return { ok: true, matchMethod: "word_sequence", actualPage: pageNumber };
  }

  // Method 6: Page Boundary Match (clause spans across page boundary)
  if (pages[pageIndex + 1]) {
    const combinedNorm = normPageText + " " + normalizeText(pages[pageIndex + 1]);
    if (combinedNorm.includes(clauseNorm) || (probe.length >= 20 && combinedNorm.includes(probe))) {
      return { ok: true, matchMethod: "page_boundary", actualPage: pageNumber };
    }
  }

  // Method 7: Adjacent Page Check (page offset resilience, e.g. off by 1 page)
  const candidateOffsets = [-1, 1];
  for (const offset of candidateOffsets) {
    const candidateIdx = pageIndex + offset;
    if (candidateIdx >= 0 && candidateIdx < pages.length) {
      const adjPageNorm = normalizeText(pages[candidateIdx]);
      if (adjPageNorm.includes(clauseNorm) || (probe.length >= 20 && adjPageNorm.includes(probe))) {
        return { ok: true, matchMethod: "adjacent_page", actualPage: candidateIdx + 1 };
      }
    }
  }

  return { ok: false, matchMethod: "none", actualPage: pageNumber };
}

/**
 * Validates each field of the scorecard against extracted document pages.
 */
export function validateScorecard(scorecard, pages) {
  const out = {};

  for (const [key, f] of Object.entries(scorecard)) {
    if (key === "_meta") {
      out._meta = f;
      continue;
    }

    if (!f || f.status === "not_found") {
      out[key] = { status: "not_found", matchMethod: "none" };
      continue;
    }

    const { ok, matchMethod, actualPage } = matchClauseOnPage(f.clause, f.page, pages);

    if (ok) {
      out[key] = {
        ...f,
        page: actualPage || f.page,
        status: "verified",
        matchMethod,
      };
      console.log(`[Validator] ${key}: VERIFIED via ${matchMethod} on page ${actualPage || f.page}`);
    } else {
      out[key] = {
        ...f,
        status: "unverified",
        matchMethod: "none",
        note: `Could not verify quote. Check page ${f.page} manually.`,
      };
      console.log(`[Validator] ${key}: UNVERIFIED (cited page ${f.page})`);
    }
  }

  return out;
}
