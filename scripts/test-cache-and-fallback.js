import fs from "node:fs";
import path from "node:path";

async function postPolicy(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "application/pdf" });
  const formData = new FormData();
  formData.append("policy", blob, path.basename(filePath));

  const res = await fetch("http://localhost:5000/api/analyze", {
    method: "POST",
    body: formData,
  });

  const json = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body: json };
}

async function run() {
  console.log("=== TEST SUITE: CACHE & FALLBACK ===");
  const samplePdf = path.resolve("sample_policy.pdf");
  if (!fs.existsSync(samplePdf)) {
    console.error("sample_policy.pdf not found!");
    process.exit(1);
  }

  console.log(`\n1. Running Request #1 on ${path.basename(samplePdf)}...`);
  const t0 = Date.now();
  const res1 = await postPolicy(samplePdf);
  console.log(`Response #1 Status: ${res1.status}`);
  console.log(`Response #1 Body:`, JSON.stringify(res1.body, null, 2));

  if (res1.ok) {
    console.log(`\n2. Running Request #2 (Same PDF) to verify disk cache...`);
    const t1 = Date.now();
    const res2 = await postPolicy(samplePdf);
    console.log(`Response #2 Status: ${res2.status}`);
    console.log(`Response #2 Body:`, JSON.stringify(res2.body, null, 2));

    console.log("\n--- CACHE VERIFICATION SUMMARY ---");
    console.log(`Request 1 - cached: ${res1.body.cached}, calls_used: ${res1.body.calls_used}`);
    console.log(`Request 2 - cached: ${res2.body.cached}, calls_used: ${res2.body.calls_used}`);
    if (res2.body.cached === true && res2.body.calls_used === 0) {
      console.log(" SUCCESS: Second run returned cached: true and 0 calls!");
    } else {
      console.error(" FAILED: Second run did not return cached: true and 0 calls.");
    }
  } else {
    console.log("Note: API call returned non-200. Check error details above.");
  }
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
