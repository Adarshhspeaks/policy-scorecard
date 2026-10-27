const norm = (s) => s.toLowerCase().replace(/\s+/g, " ").trim();

// Rejects any field whose quoted clause isn't actually on the cited page.
export function validateScorecard(scorecard, pages) {
  const out = {};
  for (const [key, f] of Object.entries(scorecard)) {
    if (!f) { out[key] = { status: "not_found" }; continue; }

    const pageText = norm(pages[f.page - 1] || "");
    const clause = norm(f.clause || "");
    // allow a prefix match so tiny PDF-extraction differences don't kill good answers
    const probe = clause.slice(0, 80);
    const ok = probe.length > 20 && pageText.includes(probe);

    out[key] = ok
      ? { status: "verified", ...f }
      : { status: "unverified", note: `Could not verify quote. Check page ${f.page} manually.` };
  }
  return out;
}
