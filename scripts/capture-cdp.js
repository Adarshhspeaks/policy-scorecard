import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const outDir = path.resolve("screenshots");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const screenshots = [
  { name: "landing_1440.png", url: "http://localhost:5173", width: 1440, height: 1300, mobile: false },
  { name: "landing_390.png", url: "http://localhost:5173", width: 390, height: 1100, mobile: true },
  { name: "single_result_1440.png", url: "http://localhost:5173?view=single", width: 1440, height: 1600, mobile: false },
  { name: "single_result_390.png", url: "http://localhost:5173?view=single", width: 390, height: 1800, mobile: true },
  { name: "compare_result_1440.png", url: "http://localhost:5173?view=compare", width: 1440, height: 1600, mobile: false },
  { name: "compare_result_390.png", url: "http://localhost:5173?view=compare", width: 390, height: 1800, mobile: true },
  { name: "error_state_1440.png", url: "http://localhost:5173?view=error", width: 1440, height: 1000, mobile: false },
  { name: "error_state_390.png", url: "http://localhost:5173?view=error", width: 390, height: 1000, mobile: true },
];

async function capture() {
  console.log("=== CAPTURING SCREENSHOTS VIA DEVTOOLS PROTOCOL ===");
  const edgeProc = spawn(edgePath, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--hide-scrollbars",
    "about:blank",
  ]);

  // Wait for Edge to start debugging server
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {}
  }

  if (!versionData) {
    console.error("Could not connect to Edge DevTools server.");
    edgeProc.kill();
    process.exit(1);
  }

  console.log("Connected to Edge:", versionData.Browser);

  for (const s of screenshots) {
    console.log(`Capturing ${s.name} (${s.width}x${s.height}, mobile=${s.mobile})...`);
    // Create new target tab
    const createRes = await fetch("http://127.0.0.1:9222/json/new?" + encodeURIComponent(s.url), { method: "PUT" });
    const target = await createRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    let msgId = 1;
    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve) => {
        const handler = (evt) => {
          const data = JSON.parse(evt.data);
          if (data.id === id) {
            ws.removeEventListener("message", handler);
            resolve(data.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    // Enable Page and Emulation
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: s.width,
      height: s.height,
      deviceScaleFactor: 1,
      mobile: s.mobile,
    });

    // Wait 1.5s for fonts and animations to settle
    await new Promise((r) => setTimeout(r, 1500));

    // Capture screenshot
    const shot = await send("Page.captureScreenshot", { format: "png" });
    if (shot && shot.data) {
      const outPath = path.join(outDir, s.name);
      fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));
      const stat = fs.statSync(outPath);
      console.log(`  -> Saved ${s.name} (${stat.size} bytes)`);
    }

    ws.close();
    // Close target tab
    await fetch("http://127.0.0.1:9222/json/close/" + target.id).catch(() => {});
  }

  edgeProc.kill();
  console.log("\nAll 8 screenshots successfully captured via CDP.");
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
