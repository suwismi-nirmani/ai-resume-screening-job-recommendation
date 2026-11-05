# Issue #21 – CareerMatch AI Scoring and Ranking Test Results

**Project:** AI Resume Screening and Job Recommendation System  
**Issue:** #21 – Verify CareerMatch AI Scoring and Ranking  
**QA Branch:** `feature/qa-testing`  
**Module:** `backend/app/matching.py`  
**Test Type:** Functional Testing and Manual Verification

---

## 1. Objective

To verify that CareerMatch AI calculates resume-to-job matching scores correctly, identifies matched and missing skills, and ranks job recommendations in descending order.

## 2. Scoring Formula

**Final Match Score = (Text Similarity × 60%) + (Skill Match × 40%)**

- **Text Similarity:** TF-IDF cosine similarity (0–100).
- **Skill Match:** Matched required skills / Total required skills × 100.

## 3. Test Environment

- Python
- PowerShell
- VS Code
- FastAPI backend
- TF-IDF cosine similarity model
- Model version: `tfidf-cosine-v1`

## 4. Test Cases and Results

| Test ID | Test Description | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---:|
| TC01 | Verify scoring formula manually | Correct weighted score | 80 × 0.60 + 75 × 0.40 = 78.00 | PASS |
| TC02 | Verify score range | Scores between 0 and 100 | All tested scores were within range | PASS |
| TC03 | Verify job ranking | Highest score first | Jobs sorted in descending order | PASS |
| TC04 | Verify matched skills | Correct matched skills identified | Java and Python matched correctly | PASS |
| TC05 | Verify missing skills | Missing skills identified correctly | PHP identified as missing | PASS |
| TC06 | Test jobs with no required skills | No missing skills returned; score behaviour recorded | Skill Match = 0.00% | OBSERVED |
| TC07 | Test strong and weak matches | Strong match scores higher than weak match | Python Backend Developer ranked above Graphic Designer | PASS |

## 5. Detailed Score Verification

### Test Resume Skills

- Python
- FastAPI
- SQL

### Job 1: Python Backend Developer

- **Text Similarity:** 69.57%
- **Skill Match:** 100%

**Calculation:**

```text
(69.57 × 0.60) + (100 × 0.40)

= 41.74 + 40.00

= 81.74%
```

- **Actual Score:** 81.74%
- **Result:** PASS

### Job 2: General Trainee

- **Text Similarity:** 34.66%
- **Skill Match:** 0%

**Calculation:**

```text
(34.66 × 0.60) + (0 × 0.40)

= 20.80%
```

- **Actual Score:** 20.80%
- **Result:** PASS

### Job 3: Graphic Designer

- **Text Similarity:** 0%
- **Skill Match:** 0%

**Calculation:**

```text
(0 × 0.60) + (0 × 0.40)

= 0%
```

- **Actual Score:** 0.00%
- **Result:** PASS

## 6. Ranking Verification

The system returned the following ranking:

| Rank | Job Title | Final Score |
|:---:|:---|---:|
| 1 | Python Backend Developer | 81.74% |
| 2 | General Trainee | 20.80% |
| 3 | Graphic Designer | 0.00% |

**Result: PASS**

Jobs were correctly sorted from highest to lowest final matching score.

## 7. Matched and Missing Skills Verification

### Python Backend Developer

- **Matched:** Python, FastAPI, SQL
- **Missing:** None

### General Trainee

- **Matched:** None
- **Missing:** None
- **Required Skills:** Empty

### Graphic Designer

- **Matched:** None
- **Missing:** Illustrator, Photoshop, Figma

**Result: PASS** for the tested skill identification logic.

## 8. Existing Evaluation Results

The existing evaluation script (`evaluation/evaluate.py`) was executed.

**Evaluation Dataset:**

- Resumes: 12
- Jobs: 30

| Metric | Result |
|:---|---:|
| Precision@3 | 72.22% |
| Recall@3 | 81.94% |
| F1@3 | 75.40% |
| Top-3 Accuracy | 100% |
| Precision@5 | 51.67% |
| Recall@5 | 95.14% |
| F1@5 | 65.94% |
| Top-5 Accuracy | 100% |

These metrics provide supporting evidence about recommendation quality. They do not independently prove the correctness of every individual matching score.

## 9. Observations

1. The weighted scoring formula is implemented correctly.
2. The final score is restricted to the 0–100 range.
3