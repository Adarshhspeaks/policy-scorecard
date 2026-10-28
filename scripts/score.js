import fs from "node:fs";
import path from "node:path";
import { FIELDS } from "../src/fields.js";

const REVIEW_CSV = path.join("eval", "manual_review.csv");

/**
 * Robust CSV parser that handles quotes, commas, and multiline cells
 */
function parseCsv(content) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        if (char === "\r") i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function runScorer() {
  console.log("==================================================");
  console.log("          MANUAL REVIEW PRECISION SCORER          ");
  console.log("==================================================");

  if (!fs.existsSync(REVIEW_CSV)) {
    console.error(`Error: File '${REVIEW_CSV}' not found. Please run 'npm run eval' first to generate it.`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(REVIEW_CSV, "utf8");
  const rows = parseCsv(rawContent);

  if (rows.length < 2) {
    console.error("Error: CSV contains no data rows.");
    process.exit(1);
  }

  const header = rows[0].map((h) => h.toLowerCase());
  const policyIdx = header.indexOf("policy");
  const fieldIdx = header.indexOf("field");
  const statusIdx = header.indexOf("status");
  const correctIdx = header.findIndex((h) => h.includes("correct"));

  if (policyIdx === -1 || fieldIdx === -1 || statusIdx === -1 || correctIdx === -1) {
    console.error("Error: Expected CSV headers (policy, field, status, correct (y/n)) not found.");
    process.exit(1);
  }

  const dataRows = rows.slice(1);
  const fieldKeys = Object.keys(FIELDS);

  let totalVerified = 0;
  let annotatedVerified = 0;
  let correctVerified = 0;
  let incorrectVerified = 0;
  let unannotatedVerified = 0;

  const perField = {};
  fieldKeys.forEach((key) => {
    perField[key] = {
      verifiedCount: 0,
      annotatedCount: 0,
      correctCount: 0,
      incorrectCount: 0,
    };
  });

  dataRows.forEach(([...cols]) => {
    const fieldKey = cols[fieldIdx];
    const status = (cols[statusIdx] || "").toLowerCase();
    const correctVal = (cols[correctIdx] || "").toLowerCase().trim();

    if (status === "verified") {
      totalVerified++;

      if (perField[fieldKey]) {
        perField[fieldKey].verifiedCount++;
      }

      const isMarkedYes = correctVal === "y" || correctVal === "yes" || correctVal === "true" || correctVal === "1";
      const isMarkedNo = correctVal === "n" || correctVal === "no" || correctVal === "false" || correctVal === "0";

      if (isMarkedYes || isMarkedNo) {
        annotatedVerified++;
        if (perField[fieldKey]) perField[fieldKey].annotatedCount++;

        if (isMarkedYes) {
          correctVerified++;
          if (perField[fieldKey]) perField[fieldKey].correctCount++;
        } else {
          incorrectVerified++;
          if (perField[fieldKey]) perField[fieldKey].incorrectCount++;
        }
      } else {
        unannotatedVerified++;
      }
    }
  });

  console.log(`\nEvaluated Total Rows: ${dataRows.length}`);
  console.log(`Total Verified Fields: ${totalVerified}`);
  console.log(`Annotated Verified Fields: ${annotatedVerified}`);
  console.log(`Un-annotated Verified Fields: ${unannotatedVerified}`);
  console.log(`Marked Correct (y): ${correctVerified}`);
  console.log(`Marked Incorrect (n): ${incorrectVerified}\n`);

  if (annotatedVerified === 0) {
    console.log("--------------------------------------------------");
    console.log("NOTICE: No rows in 'eval/manual_review.csv' have been marked with 'y' or 'n' yet.");
    console.log("To measure precision:");
    console.log("  1. Open 'eval/manual_review.csv' in Excel, VS Code, or a text editor.");
    console.log("  2. In the 'correct (y/n)' column, fill 'y' if the extracted fact is correct, or 'n' if incorrect.");
    console.log("  3. Run 'npm run score' again to view precision scores.");
    console.log("--------------------------------------------------\n");
    return;
  }

  const overallPrecision = annotatedVerified > 0 ? ((correctVerified / annotatedVerified) * 100).toFixed(1) : "0.0";
  console.log("==================================================");
  console.log(`OVERALL PRECISION: ${overallPrecision}% (${correctVerified}/${annotatedVerified} annotated verified fields)`);
  console.log("==================================================\n");

  console.log("PER-FIELD PRECISION BREAKDOWN:");
  console.log("------------------------------------------------------------------------------------------------");
  console.log(
    "Field Key".padEnd(28) +
      "Verified".padStart(10) +
      "Annotated".padStart(12) +
      "Correct".padStart(10) +
      "Precision".padStart(14)
  );
  console.log("------------------------------------------------------------------------------------------------");

  fieldKeys.forEach((key) => {
    const stat = perField[key];
    const precision = stat.annotatedCount > 0 ? ((stat.correctCount / stat.annotatedCount) * 100).toFixed(1) + "%" : "N/A";
    console.log(
      key.padEnd(28) +
        String(stat.verifiedCount).padStart(10) +
        String(stat.annotatedCount).padStart(12) +
        String(stat.correctCount).padStart(10) +
        precision.padStart(14)
    );
  });
  console.log("------------------------------------------------------------------------------------------------\n");
}

runScorer();
