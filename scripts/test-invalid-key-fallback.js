import "../src/env.js";
import { executeScorecardExtraction } from "../src/providers/index.js";
import { pdfToPages } from "../src/pdf.js";
import fs from "node:fs";

async function testInvalidKey() {
  console.log("=== TEST: INVALID GEMINI_API_KEY FALLBACK ===");
  const originalKey = process.env.GEMINI_API_KEY;
  const originalCache = process.env.CACHE;

  try {
    process.env.GEMINI_API_KEY = "INVALID_TEST_KEY_xyz123";
    process.env.CACHE = "off"; // bypass cache to force provider call

    const pdfBuffer = fs.readFileSync("sample_policy.pdf");
    const pages = await pdfToPages(pdfBuffer);

    console.log("Invoking executeScorecardExtraction with invalid GEMINI_API_KEY and CACHE=off...");
    await executeScorecardExtraction({
      prompt: "Extract fields",
      schema: null,
      pages,
    });

    console.error("FAIL: Expected extraction to fail/fallback when all providers are unconfigured.");
  } catch (err) {
    console.log("\nSUCCESS: Caught expected combined error from provider fallback chain!");
    console.log("Error status:", err.status);
    console.log("Error message:\n" + err.message);
    if (err.providerErrors) {
      console.log("\nProvider Error Breakdown:");
      err.providerErrors.forEach((pe) => {
        console.log(`- Provider: ${pe.provider} (${pe.model}) | Status: ${pe.status} | Error: ${pe.error}`);
      });
    }
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
    process.env.CACHE = originalCache;
  }
}

testInvalidKey().catch(console.error);
