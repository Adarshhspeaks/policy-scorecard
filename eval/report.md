# Policy Scorecard Evaluation Report

Generated: 2026-10-28T12:22:02.219Z  
Configured Providers: `gemini,groq,ollama`  
Total API Calls Used This Run: **0** (Cap: Unlimited)  

---

## 1. Executive Summary

- **Total Policies Evaluated**: 6
- **Successfully Analyzed Policies**: 5
- **Skipped / Error Policies**: 1 (e.g. Scanned PDFs / OCR required)
- **Total Fields Evaluated**: 40
- **Overall Verification Rate**: **37.5%** (15/40 fields verified)
- **Unverified Fields**: 0
- **Not Found Fields**: 25
- **Total LLM API Calls Made**: 0

---

## 2. Policy-by-Policy Results Table

| Policy Name | Pages | Chars | Verified | Unverified | Not Found | Provider | Model | Cache Status | Calls | Time (s) | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `Care_Advantage_Large_Policy.pdf` | 14 | 7,686 | 3 | 0 | 5 | `gemini` | `gemini-3.5-flash-lite` | Cached | 0 | 0.08 | Success |
| `HDFC_Ergo_Optima_Restore_Sample.pdf` | 3 | 2,378 | 3 | 0 | 5 | `gemini` | `gemini-3.5-flash-lite` | Cached | 0 | 0.00 | Success |
| `MediCare_Plus_Sample.pdf` | 3 | 2,916 | 3 | 0 | 5 | `gemini` | `gemini-3.5-flash-lite` | Cached | 0 | 0.01 | Success |
| `Scanned_Doc_Sample.pdf` | 1 | 19 | 0 | 0 | 0 | `N/A` | `N/A` | Fresh | 0 | 0.01 | Error 422: Looks like a scanned PDF (19 c... |
| `SecureLife_Health_Shield_Sample.pdf` | 3 | 2,994 | 3 | 0 | 5 | `gemini` | `gemini-3.5-flash-lite` | Cached | 0 | 0.01 | Success |
| `Star_Comprehensive_Health_Policy.pdf` | 4 | 3,169 | 3 | 0 | 5 | `gemini` | `gemini-3.5-flash-lite` | Cached | 0 | 0.01 | Success |

---

## 3. Per-Field Accuracy Breakdown

| Field Key | Human Description | Verified | Unverified | Not Found | Verification Rate |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `waiting_period_initial` | Initial waiting period before any claim (except accidents) | 5 | 0 | 0 | **100.0%** |
| `waiting_period_preexisting` | Waiting period for pre-existing diseases | 5 | 0 | 0 | **100.0%** |
| `waiting_period_specific` | Waiting period for specific illnesses/procedures (e.g. cataract, hernia) | 5 | 0 | 0 | **100.0%** |
| `room_rent_cap` | Room rent limit / cap (per day or % of sum insured) | 0 | 0 | 5 | **0.0%** |
| `copay` | Co-payment percentage the policyholder must pay | 0 | 0 | 5 | **0.0%** |
| `sub_limits` | Sub-limits on specific treatments or disease groups | 0 | 0 | 5 | **0.0%** |
| `exclusions` | Major permanent exclusions (what is never covered) | 0 | 0 | 5 | **0.0%** |
| `claim_conditions` | Key claim conditions (intimation deadline, documents, cashless rules) | 0 | 0 | 5 | **0.0%** |

---

## 4. Validator Match Method Statistics

| Match Method | Description | Count | % of Verified |
| :--- | :--- | :---: | :---: |
| `exact_raw` | Matched via exact raw | 15 | 100.0% |

---

## 5. Unverified Fields Inspection List

All extracted non-null clauses were successfully verified against the source PDF text! Zero unverified fields.

---

## 6. Investigation: Common Causes of Verification Failures in Policy PDFs

Based on PDF text extraction noise and multi-column formatting, the top 3 causes of verification challenges are:

1. **Multi-Column and Table Header Interleaving**:
   - *Description*: Standard PDF parsers (like `pdf-parse`) read text objects in order of appearance in the PDF stream. Multi-column layouts can interleave left and right columns across table cells.
   - *Example*: A table with columns 'Waiting Period' and 'Applicable Conditions' may extract as `'Waiting Period 30 Days Applicable Conditions All Illnesses'` instead of a continuous sentence, breaking raw sentence lookups.
   - *Mitigation*: Our sliding window token matching and unicode/punctuation normalization bridge interleaved spaces.

2. **Hyphenation and Line-Wrap Splits**:
   - *Description*: Legal documents wrap compound words across line breaks (e.g. `'pre-\nexisting'`, `'in-\npatient'`).
   - *Example*: The model quotes `'pre-existing diseases'` while the PDF stream has `'pre-\n existing diseases'` or soft hyphen `'pre\u00ADexisting'`.
   - *Mitigation*: The upgraded normalizer de-hyphenates line breaks and removes soft hyphens before matching.

3. **Page Boundary Crossings and Running Headers/Footers**:
   - *Description*: Long definitions and operative clauses start at the bottom of one page and terminate on the next, with running page headers and footers inserted midway.
   - *Example*: A 48-month waiting period clause starts on line 42 of page 2 and completes on line 1 of page 3, with `'Page 2 of 14 -- Star Health Comprehensive Policy'` between them.
   - *Mitigation*: Our multi-page boundary matching combines consecutive pages to verify clauses spanning page splits.