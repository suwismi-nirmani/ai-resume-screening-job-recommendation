# Issue #20 -- Skill Extraction Test Results

## 1. Introduction

The purpose of this testing is to verify whether the CareerMatch AI system correctly extracts skills from uploaded resumes.

Testing was performed using controlled TXT sample resumes through FastAPI Swagger UI.

**Endpoint:** `POST /api/resumes`

## 2. Test Environment

- Application: CareerMatch AI
- API: FastAPI
- Testing tool: Swagger UI
- File format: TXT

## 3. Test Cases and Results

| Test ID | Test Scenario | Input | Expected Skills | Actual Skills Result | Status |
|---|---|---|---|---|---|
| TC-001 | Normal skill extraction | Python, SQL, JavaScript, Git, AWS | 5 skills | aws, git, javascript, python, sql (5) | PASS |
| TC-002 | Duplicate skills | Python, python, PYTHON, SQL, sql, AWS, aws | aws, python, sql (3) | aws, python, sql (3) | PASS |
| TC-003 | Uppercase and lowercase | PYTHON, python, PyThOn, SQL, sql, JavaScript, JAVASCRIPT, javascript | javascript, python, sql (3) | javascript, python, sql (3) | PASS |
| TC-004 | Resume without known skills | Reading, travelling, movies and family | Empty list (0) | Empty list (0) | PASS |
| TC-005 | Multi-word skill | Machine Learning | machine learning (1) | machine learning (1) | PASS |
| TC-006 | Similar technology names | Java, JavaScript, SQL, NoSQL | java, javascript, sql (3 supported skills) | java, javascript, sql (3) | PASS |

## 4. Observations

1. The system correctly extracts supported skills.
2. Duplicate skills are removed.
3. Skill matching is case-insensitive.
4. Multi-word skills such as Machine Learning are correctly detected.
5. Java and JavaScript are correctly identified as separate skills.
6. NoSQL was not extracted because it is not currently included in the `SKILL_ALIASES` dictionary in `backend/app/nlp.py`.

**Note:** NoSQL is recorded as a skill-list coverage limitation, not a confirmed extraction bug.

## 5. Test Summary

| Description | Count |
|---|---:|
| Total test cases | 6 |
| Passed | 6 |
| Failed | 0 |

## 6. Conclusion

The skill extraction functionality passed all six test cases using the currently configured skill dictionary.

The system correctly handles normal skills, duplicates, different letter cases, resumes without supported skills, multi-word skills and similar technology names.

The supported skill list could be expanded to include additional technologies such as NoSQL.

No confirmed extraction bugs were identified during testing.