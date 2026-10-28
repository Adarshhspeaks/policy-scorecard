import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

console.log(`Loaded key length: ${apiKey ? apiKey.length : 0}, starts with: ${apiKey ? apiKey.slice(0, 4) : "NONE"}`);
console.log(`Configured model: ${modelName}`);

const ai = new GoogleGenAI({ apiKey });

async function run() {
  console.log("\n--- Listing Models ---");
  try {
    const listResult = await ai.models.list();
    if (Symbol.asyncIterator in Object(listResult)) {
      for await (const m of listResult) {
        console.log(`Model: ${m.name || m.id || JSON.stringify(m)}`);
      }
    } else if (Array.isArray(listResult)) {
      listResult.forEach((m) => console.log(`Model: ${m.name || m.id || JSON.stringify(m)}`));
    } else if (listResult && typeof listResult === "object") {
      console.log("List result keys:", Object.keys(listResult));
      if (Array.isArray(listResult.models)) {
        listResult.models.forEach((m) => console.log(`Model: ${m.name || m.id}`));
      } else {
        console.log(JSON.stringify(listResult, null, 2));
      }
    } else {
      console.log("List result:", listResult);
    }
  } catch (err) {
    console.error("Error listing models:");
    console.error(`Status code: ${err.status || err.statusCode || err.code}`);
    console.error(`Message: ${err.message}`);
    if (err.errorDetails) console.error("Error details:", err.errorDetails);
  }

  console.log(`\n--- Calling generateContent on ${modelName} ---`);
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello, reply with 1 word.",
    });
    console.log("Success! Response text:", response.text);
  } catch (err) {
    console.error("Error calling generateContent:");
    console.error(`Status code: ${err.status || err.statusCode || err.code}`);
    console.error(`Message: ${err.message}`);
    if (err.errorDetails) console.error("Error details:", err.errorDetails);
    console.error("Full error:", err);
  }
}

run();
