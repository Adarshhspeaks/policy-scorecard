import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { pdfToPages } from "./pdf.js";
import { extractScorecard } from "./extract.js";
import { validateScorecard } from "./validate.js";

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.post("/api/analyze", upload.single("policy"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Upload a PDF as 'policy'" });

    const pages = await pdfToPages(req.file.buffer);
    const totalChars = pages.join("").length;
    if (totalChars < 500) {
      return res.status(422).json({ error: "Looks like a scanned PDF. OCR not added yet." });
    }

    const raw = await extractScorecard(pages);
    const scorecard = validateScorecard(raw, pages);
    res.json({ pages: pages.length, scorecard });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 5000, () => console.log("API running"));
