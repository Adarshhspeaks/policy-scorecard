# Policy Scorecard

AI-powered insurance policy clause extractor and verification scorecard. Extracts critical policy conditions (waiting periods, room rent caps, co-pay rules, exclusions) from Indian health insurance policy PDFs with verbatim citations verified against cited page numbers.

---

## Project Structure

```
policy-scorecard/
├── src/                  # Express / Node.js backend
│   ├── server.js         # API server (POST /api/analyze)
│   ├── extract.js        # Gemini AI extraction with schema
│   ├── fields.js         # Field definitions & extraction prompts
│   ├── pdf.js            # PDF page text extraction
│   └── validate.js       # Verbatim citation validation
├── client/               # Vite + React + Tailwind frontend
│   ├── src/
│   │   ├── components/   # UploadZone, ScorecardView, ScorecardCard, etc.
│   │   ├── utils/        # Formatters, helpers
│   │   ├── App.jsx       # Main application
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── .env.example          # Backend environment variables
├── package.json
└── README.md
```

---

## How to Run Backend + Client Together

### 1. Prerequisites
- Node.js (v18+)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Configure Environment Variables

**Backend (`.env` in root):**
```bash
cp .env.example .env
```
Edit `.env` and set your key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
```

**Frontend (`client/.env` in `/client`):**
```bash
cd client
cp .env.example .env
```
Ensure `VITE_API_URL` points to your backend:
```env
VITE_API_URL=http://localhost:5000
```

---

### 3. Install Dependencies

In the root directory (backend):
```bash
npm install
```

In the `client` directory (frontend):
```bash
cd client
npm install
cd ..
```

---

### 4. Start the Application

You can start both services in separate terminal windows:

#### Terminal 1 — Backend API:
```bash
npm start
```
> Backend runs at `http://localhost:5000`

#### Terminal 2 — Frontend UI:
```bash
cd client
npm run dev
```
*(Or from the root directory: `npm run client`)*
> Frontend runs at `http://localhost:5173`

---

## API Specification

### `POST /api/analyze`
Accepts a PDF document as `multipart/form-data` with field name `policy`.

**Request:**
- Header: `Content-Type: multipart/form-data`
- Body: `policy` (PDF file, max 20MB)

**Response (200 OK):**
```json
{
  "pages": 12,
  "scorecard": {
    "waiting_period_initial": {
      "status": "verified",
      "value": "30 days waiting period applies to all illnesses except accidents.",
      "page": 4,
      "clause": "A waiting period of 30 days from the inception date of the policy shall apply...",
      "confidence": "high"
    },
    "copay": {
      "status": "unverified",
      "note": "Could not verify quote. Check page 8 manually."
    },
    "sub_limits": {
      "status": "not_found"
    }
  }
}
```

**Error Responses:**
- `400`: Missing or invalid file (`Upload a PDF as 'policy'`)
- `422`: Scanned PDF with fewer than 500 characters (`Looks like a scanned PDF. OCR not added yet.`)
- `500`: Processing or AI generation error
