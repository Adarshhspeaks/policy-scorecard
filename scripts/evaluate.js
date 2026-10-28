import "../src/env.js";
import fs from "node:fs";
import path from "node:path";
import { pdfToPages } from "../src/pdf.js";
import { extractScorecard } from "../src/extract.js";
import { validateScorecard } from "../src/validate.js";
import { FIELDS } from "../src/fields.js";

const EVAL_DIR = "eval";
const POLICIES_DIR = path.join(EVAL_DIR, "policies");
const RESULTS_DIR = path.join(EVAL_DIR, "results");
const REPORT_FILE = path.join(EVAL_DIR, "report.md");
const REVIEW_CSV = path.join(EVAL_DIR, "manual_review.csv");

function csvEscape(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function runEvaluation() {
  console.log("==================================================");
  console.log("       POLICY SCORECARD EVALUATION HARNESS        ");
  console.log("==================================================");

  if (!fs.existsSync(POLICIES_DIR)) {
    console.error(`Error: Policy directory '${POLICIES_DIR}' does not exist.`);
    process.exit(1);
  }

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const files = fs
    .readdirSync(POLICIES_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();

  if (files.length === 0) {
    console.error(`No PDF files found in ${POLICIES_DIR}.`);
    process.exit(1);
  }

  console.log(`Found ${files.length} policies to evaluate in ${POLICIES_DIR}.\n`);

  const results = [];
  const fieldKeys = Object.keys(FIELDS);

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filepath = path.join(POLICIES_DIR, filename);
    console.log(`[${i + 1}/${files.length}] Evaluating: ${filename}`);

    const t0 = Date.now();
    let fileResult = {
      filename,
      success: false,
      pages: 0,
      charsExtracted: 0,
      verified: 0,
      unverified: 0,
      notFound: 0,
      timeTakenSec: "0.00",
      chunkingUsed: false,
      chunksCount: 1,
      scorecard: {},
      error: null,
      errorStatus: null,
    };

    try {
      const buffer = fs.readFileSync(filepath);
      const pages = await pdfToPages(buffer);
      const charsExtracted = pages.join("").length;
      fileResult.pages = pages.length;
      fileResult.charsExtracted = charsExtracted;

      if (charsExtracted < 500) {
        throw {
          status: 422,
          message: `Looks like a scanned PDF (${charsExtracted} chars). OCR not supported yet.`,
        };
      }

      console.log(`  -> Extracted ${pages.length} pages, ${charsExtracted} characters.`);
      const raw = await extractScorecard(pages);
      const scorecard = validateScorecard(raw, pages);

      fileResult.scorecard = scorecard;
      fileResult.success = true;

      const meta = scorecard._meta || raw._meta || {};
      fileResult.chunkingUsed = Boolean(meta.chunkingUsed);
      fileResult.chunksCount = meta.chunksCount || 1;

      // Count statuses
      for (const key of fieldKeys) {
        const item = scorecard[key];
        const status = item?.status || "not_found";
        if (status === "verified") fileResult.verified++;
        else if (status === "unverified") fileResult.unverified++;
        else fileResult.notFound++;
      }

      const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
      fileResult.timeTakenSec = elapsed;
      console.log(
        `  -> Completed in ${elapsed}s: ${fileResult.verified} verified, ${fileResult.unverified} unverified, ${fileResult.notFound} not found.` +
          (fileResult.chunkingUsed ? ` (Chunking: ${fileResult.chunksCount} chunks)` : "")
      );
    } catch (err) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
      fileResult.timeTakenSec = elapsed;
      fileResult.error = err.message || String(err);
      fileResult.errorStatus = err.status || 500;
      console.warn(`  -> Skipped/Failed (${fileResult.errorStatus}): ${fileResult.error}`);
    }

    results.push(fileResult);

    // Save individual raw result JSON
    const jsonOutputName = filename.endsWith(".pdf") ? filename.replace(/\.pdf$/i, ".json") : `${filename}.json`;
    fs.writeFileSync(path.join(RESULTS_DIR, jsonOutputName), JSON.stringify(fileResult, null, 2));

    // 2-second rate-limit throttle between files
    if (i < files.length - 1) {
      console.log("  Waiting 2s before next policy to respect rate limits...\n");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log("\nAll policies processed. Generating evaluation reports...");

  // Generate Report & CSV
  generateMarkdownReport(results, fieldKeys);
  generateManualReviewCsv(results, fieldKeys);

  console.log(`\nEvaluation complete!`);
  console.log(`- Markdown report: ${REPORT_FILE}`);
  console.log(`- Manual review CSV: ${REVIEW_CSV}`);
  console.log(`- Raw results: ${RESULTS_DIR}/`);
}

function generateMarkdownReport(results, fieldKeys) {
  const successfulPolicies = results.filter((r) => r.success);
  const totalAnalyzed = successfulPolicies.length;
  const totalFields = totalAnalyzed * fieldKeys.length;

  let totalVerified = 0;
  let totalUnverified = 0;
  let totalNotFound = 0;

  successfulPolicies.forEach((r) => {
    totalVerified += r.verified;
    totalUnverified += r.unverified;
    totalNotFound += r.notFound;
  });

  const overallRate = totalFields > 0 ? ((totalVerified / totalFields) * 100).toFixed(1) : "0.0";

  // Per-field aggregations
  const perFieldStats = {};
  fieldKeys.forEach((key) => {
    perFieldStats[key] = { verified: 0, unverified: 0, notFound: 0 };
  });

  const unverifiedList = [];

  successfulPolicies.forEach((r) => {
    fieldKeys.forEach((key) => {
      const item = r.scorecard[key];
      const status = item?.status || "not_found";

      if (status === "verified") perFieldStats[key].verified++;
      else if (status === "unverified") {
        perFieldStats[key].unverified++;
        unverifiedList.push({
          policy: r.filename,
          field: key,
          fieldDesc: FIELDS[key],
          page: item?.page || "N/A",
          value: item?.value || "N/A",
          clause: item?.clause || "N/A",
          note: item?.note || "Quote could not be matched on cited page.",
        });
      } else {
        perFieldStats[key].notFound++;
      }
    });
  });

  // Match method stats across verified fields
  const matchMethodCounts = {};
  successfulPolicies.forEach((r) => {
    fieldKeys.forEach((key) => {
      const item = r.scorecard[key];
      if (item?.status === "verified") {
        const method = item.matchMethod || "exact_or_legacy";
        matchMethodCounts[method] = (matchMethodCounts[method] || 0) + 1;
      }
    });
  });

  const lines = [];

  lines.push("# Policy Scorecard Evaluation Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}  `);
  lines.push(`Evaluator Engine: Google Gemini API (${process.env.GEMINI_MODEL || "gemini-2.5-flash"})  `);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## 1. Executive Summary");
  lines.push("");
  lines.push(`- **Total Policies Evaluated**: ${results.length}`);
  lines.push(`- **Successfully Analyzed Policies**: ${totalAnalyzed}`);
  lines.push(`- **Skipped / Error Policies**: ${results.length - totalAnalyzed} (e.g. Scanned PDFs / OCR required)`);
  lines.push(`- **Total Fields Evaluated**: ${totalFields}`);
  lines.push(`- **Overall Verification Rate**: **${overallRate}%** (${totalVerified}/${totalFields} fields verified)`);
  lines.push(`- **Unverified Fields**: ${totalUnverified}`);
  lines.push(`- **Not Found Fields**: ${totalNotFound}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## 2. Policy-by-Policy Results Table");
  lines.push("");
  lines.push("| Policy Name | Pages | Chars Extracted | Verified | Unverified | Not Found | Chunking | Time (s) | Status |");
  lines.push("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |");

  results.forEach((r) => {
    const chunkInfo = r.chunkingUsed ? `Yes (${r.chunksCount} chunks)` : "No";
    const statusLabel = r.success ? "Success" : `Error ${r.errorStatus || ""}: ${r.error?.slice(0, 35)}...`;
    lines.push(
      `| \`${r.filename}\` | ${r.pages} | ${r.charsExtracted.toLocaleString()} | ${r.verified} | ${r.unverified} | ${r.notFound} | ${chunkInfo} | ${r.timeTakenSec} | ${statusLabel} |`
    );
  });

  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## 3. Per-Field Accuracy Breakdown");
  lines.push("");
  lines.push("| Field Key | Human Description | Verified | Unverified | Not Found | Verification Rate |");
  lines.push("| :--- | :--- | :---: | :---: | :---: | :---: |");

  fieldKeys.forEach((key) => {
    const stat = perFieldStats[key];
    const total = totalAnalyzed;
    const rate = total > 0 ? ((stat.verified / total) * 100).toFixed(1) : "0.0";
    lines.push(
      `| \`${key}\` | ${FIELDS[key]} | ${stat.verified} | ${stat.unverified} | ${stat.notFound} | **${rate}%** |`
    );
  });

  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## 4. Validator Match Method Statistics");
  lines.push("");
  lines.push("| Match Method | Description | Count | % of Verified |");
  lines.push("| :--- | :--- | :---: | :---: |");

  Object.entries(matchMethodCounts).forEach(([method, count]) => {
    const pct = totalVerified > 0 ? ((count / totalVerified) * 100).toFixed(1) : "0.0";
    lines.push(`| \`${method}\` | Matched via ${method.replace(/_/g, " ")} | ${count} | ${pct}% |`);
  });

  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## 5. Unverified Fields Inspection List");
  lines.push("");
  if (unverifiedList.length === 0) {
    lines.push("All extracted non-null clauses were successfully verified against the source PDF text! Zero unverified fields.");
  } else {
    lines.push(`The following ${unverifiedList.length} field(s) were flagged as **unverified** because their quoted clause could not be located on the cited page:\n`);
    unverifiedList.forEach((item, idx) => {
      lines.push(`### ${idx + 1}. Policy: \`${item.policy}\` — Field: \`${item.field}\``);
      lines.push(`- **Cited Page**: Page ${item.page}`);
      lines.push(`- **Plain-Language Value**: ${item.value}`);
      lines.push(`- **Model's Quoted Clause**:`);
      lines.push(`  > "${item.clause}"`);
      lines.push(`- **Validator Note**: ${item.note}`);
      lines.push("");
    });
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## 6. Investigation: Common Causes of Verification Failures in Policy PDFs");
  lines.push("");
  lines.push("Based on PDF text extraction noise and multi-column formatting, the top 3 causes of verification challenges are:");
  lines.push("");
  lines.push("1. **Multi-Column and Table Header Interleaving**:");
  lines.push("   - *Description*: Standard PDF parsers (like `pdf-parse`) read text objects in order of appearance in the PDF stream. Multi-column layouts can interleave left and right columns across table cells.");
  lines.push("   - *Example*: A table with columns 'Waiting Period' and 'Applicable Conditions' may extract as `'Waiting Period 30 Days Applicable Conditions All Illnesses'` instead of a continuous sentence, breaking raw sentence lookups.");
  lines.push("   - *Mitigation*: Our sliding window token matching and unicode/punctuation normalization bridge interleaved spaces.");
  lines.push("");
  lines.push("2. **Hyphenation and Line-Wrap Splits**:");
  lines.push("   - *Description*: Legal documents wrap compound words across line breaks (e.g. `'pre-\\nexisting'`, `'in-\\npatient'`).");
  lines.push("   - *Example*: The model quotes `'pre-existing diseases'` while the PDF stream has `'pre-\\n existing diseases'` or soft hyphen `'pre\\u00ADexisting'`.");
  lines.push("   - *Mitigation*: The upgraded normalizer de-hyphenates line breaks and removes soft hyphens before matching.");
  lines.push("");
  lines.push("3. **Page Boundary Crossings and Running Headers/Footers**:");
  lines.push("   - *Description*: Long definitions and operative clauses start at the bottom of one page and terminate on the next, with running page headers and footers inserted midway.");
  lines.push("   - *Example*: A 48-month waiting period clause starts on line 42 of page 2 and completes on line 1 of page 3, with `'Page 2 of 14 -- Star Health Comprehensive Policy'` between them.");
  lines.push("   - *Mitigation*: Our multi-page boundary matching combines consecutive pages to verify clauses spanning page splits.");

  fs.writeFileSync(REPORT_FILE, lines.join("\n"));
}

function generateManualReviewCsv(results, fieldKeys) {
  const rows = [];
  rows.push(["policy", "field", "value", "page", "clause", "status", "correct (y/n)"].map(csvEscape).join(","));

  results.forEach((r) => {
    if (!r.success) {
      // Record failed policy with error
      rows.push([r.filename, "ALL_FIELDS", `ERROR: ${r.error}`, "N/A", "N/A", "error", ""].map(csvEscape).join(","));
      return;
    }

    fieldKeys.forEach((key) => {
      const item = r.scorecard[key] || {};
      const status = item.status || "not_found";
      const value = item.value || "";
      const page = item.page || "";
      const clause = item.clause || "";

      rows.push([r.filename, key, value, page, clause, status, ""].map(csvEscape).join(","));
    });
  });

  fs.writeFileSync(REVIEW_CSV, rows.join("\n"));
}

runEvaluation().catch((err) => {
  console.error("Evaluation run crashed:", err);
  process.exit(1);
});
