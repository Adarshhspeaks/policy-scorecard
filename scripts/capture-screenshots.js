import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = path.resolve("screenshots");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const screenshots = [
  { name: "landing_1440.png", url: "http://localhost:5173", width: 1440, height: 1300 },
  { name: "landing_390.png", url: "http://localhost:5173", width: 390, height: 1100 },
  { name: "single_result_1440.png", url: "http://localhost:5173?view=single", width: 1440, height: 1600 },
  { name: "single_result_390.png", url: "http://localhost:5173?view=single", width: 390, height: 1800 },
  { name: "compare_result_1440.png", url: "http://localhost:5173?view=compare", width: 1440, height: 1600 },
  { name: "compare_result_390.png", url: "http://localhost:5173?view=compare", width: 390, height: 1800 },
  { name: "error_state_1440.png", url: "http://localhost:5173?view=error", width: 1440, height: 1000 },
  { name: "error_state_390.png", url: "http://localhost:5173?view=error", width: 390, height: 1000 },
];

console.log("=== CAPTURING UI SCREENSHOTS ===");

for (const s of screenshots) {
  const filePath = path.join(outDir, s.name);
  console.log(`Capturing ${s.name} (${s.width}x${s.height}) at ${s.url}...`);
  const cmd = `"${edgePath}" --headless=new --hide-scrollbars --force-device-scale-factor=1 --disable-gpu --virtual-time-budget=2000 "--screenshot=${filePath}" "--window-size=${s.width},${s.height}" "${s.url}"`;
  try {
    execSync(cmd, { stdio: "ignore" });
    const stat = fs.statSync(filePath);
    console.log(`  -> Saved ${s.name} (${stat.size} bytes)`);
  } catch (err) {
    console.error(`  -> Failed to capture ${s.name}:`, err.message);
  }
}

console.log("\nAll screenshots generated in screenshots/ directory.");
