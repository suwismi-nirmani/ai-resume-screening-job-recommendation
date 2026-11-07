# Resume Upload and File Validation – Test Results

**Project:** AI Resume Screening and Job Recommendation System  
**Milestone:** 1  
**GitHub Issue:** #19 – Test resume upload and file validation  
**Test Environment:** Local FastAPI backend using Swagger UI  
**Base URL:** `http://127.0.0.1:8000`  
**Execution Date:** 4 November 2026

---

## 1. Objective

Verify that the resume upload API accepts supported resume files and rejects unsupported, empty, oversized, unreadable, or invalid files with appropriate responses.

## 2. Summary

- The report includes 14 previously executed API tests and two additional scenarios: unusual filename and missing file.
- TC-API-001, TC-API-002, and TC-API-003 have confirmed HTTP 200 responses.
- The unusual-filename test returned HTTP 200.
- The missing-file scenario remains blocked because Swagger UI did not execute the request when no file was selected.
- No failed test has been recorded in the observed results. A blocked test is not counted as passed.

## 3. Detailed Test Results

| Test ID | Scenario / Endpoint | Expected Result | Actual Result | HTTP Status | Result |
|---|---|---|---|---|---|
| TC-API-001 | `GET /api/health` – backend health | HTTP 200 and `{"status":"ok"}` | Response body was `{"status":"ok"}` | 200 | PASS |
| TC-API-002 | `GET /api/jobs` – retrieve active jobs | Return a JSON list of active jobs | Three active jobs returned: Python Developer, Frontend Developer and Data Analyst | 200 | PASS |
| TC-API-003 | `POST /api/resumes` – upload valid PDF resume | Accept readable PDF and return extracted resume information | Resume ID 3; 1,718 characters extracted; 11 skills detected | 200 | PASS |
| TC-API-004 | `POST /api/resumes` – unsupported file type | Reject files other than PDF or TXT | `Only PDF and TXT files are supported.` | 415 | PASS |
| TC-API-005 | `GET /api/resumes/99999` – unknown ID | Return HTTP 404 when resume does not exist | `Resume not found.` | 404 | PASS |
| TC-API-006 | `POST /api/resumes` – empty TXT | Reject empty file | `File is empty.` | 400 | PASS |
| TC-API-007 | `GET /api/resumes/1` – existing ID | Return saved resume information | Saved resume information was returned | 200 | PASS |
| TC-API-008 | `POST /api/resumes` – oversized PDF | Reject file larger than configured 5 MiB limit | `Maximum file size is 5 MB.` | 413 | PASS |
| TC-API-009 | `POST /api/resumes` – invalid PDF content | Reject non-PDF content uploaded with `.pdf` filename | `Invalid PDF file.` | 400 | PASS |
| TC-API-010 | `POST /api/resumes` – blank PDF | Reject PDF with no readable text | `No readable text found. Use a text-based resume.` | 422 | PASS |
| TC-API-011 | `POST /api/resumes` – password-protected PDF | Reject encrypted PDF | `Password-protected PDFs are not supported.` | 400 | PASS |
| TC-API-012 | `POST /api/resumes` – invalid UTF-8 TXT | Reject TXT with invalid UTF-8 encoding | `TXT file must use UTF-8 encoding.` | 400 | PASS |
| TC-API-013 | `POST /api/resumes` – invalid binary/control content | Reject TXT containing invalid control characters | `TXT file contains invalid binary content.` | 400 | PASS |
| TC-API-014 | `POST /api/resumes` – 31-page PDF | Reject PDF with more than 30 pages | `Maximum 30 PDF pages are supported.` | 400 | PASS |
| TC-API-015 | `POST /api/resumes` – unusual filename | Accept supported PDF and preserve filename | `HASINI RESUME @2026!.pdf` accepted; filename preserved; resume ID 2 returned | 200 | PASS |
| TC-API-016 | `POST /api/resumes` – missing file | Return validation error when no file is submitted | Swagger UI did not execute the request when file field was left empty | Not available | BLOCKED |

## 4. Issue #19 Acceptance Criteria

| Required Scenario | Related Test | Status |
|---|---|---|
| Valid PDF | TC-API-003 | PASS – HTTP 200 |
| Non-PDF file | TC-API-004 | PASS – HTTP 415 |
| PDF larger than 5 MB | TC-API-008 | PASS – HTTP 413 |
| Empty file | TC-API-006 | PASS – HTTP 400 |
| Missing file | TC-API-016 | BLOCKED – not executed |
| Unusual filename | TC-API-015 | PASS – HTTP 200 |
| Valid PDF containing normal resume text | TC-API-003 | PASS – HTTP 200; text and skills extracted |

## 5. Notes and Limitations

1. The upload size limit configured in the application is `5 * 1024 * 1024` bytes (5 MiB).
2. TC-API-003 used a sample PDF named `Black and White Minimalist Professional Software Developer CV.pdf`. The API returned HTTP 200, extracted 1,718 characters, and identified 11 skills.
3. Do not include full extracted resume text, phone numbers, email addresses, or other personal details in public GitHub reports. This report records only the minimum test evidence needed.
4. TC-API-016 has not been verified. Swagger UI did not execute the request with an empty required file field. Do not mark it PASS or FAIL.
5. TC-API-015 confirms that the API accepted the filename `HASINI RESUME @2026!.pdf` and preserved it.
6. The tests describe observed behavior in the local development environment. They do not establish that every security, authorization, fairness, or deployment requirement has been tested.

## 6. Overall Result

The observed tests confirm successful health and active-jobs responses, successful upload and extraction of a sample PDF, and expected rejection of the tested invalid file scenarios.

The missing-file scenario remains blocked and requires another method of execution before it can be signed off.

---

**Application Version / Git Commit:** To be recorded  
**Reviewed By:** Pending