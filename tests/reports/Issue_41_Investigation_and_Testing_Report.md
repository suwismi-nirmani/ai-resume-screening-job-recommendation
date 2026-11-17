# Issue #41 – Investigation and Testing Report

## 1. Bug 1: Unexpected "Software Testing" Skill Detection

- Investigated the NLP skill extraction logic.
- Found that all three sample resumes contain the footer sentence: "Sample resume created for software testing only."
- The `extract_skills()` function correctly detects the phrase based on the existing skill aliases.
- This is expected behaviour for the current sample resumes.
- No source code changes were made for this observation.

## 2. Bug 2: Blank Posted Date on Job Details

- Investigated the database and found that existing demo job records had empty `posted_date` values.
- The sample job seeding function does not update existing records when the jobs table is already populated.
- Created a database backup before updating the records.
- Updated the empty `posted_date` values in the local demo database to `2026-11-17`.
- No application source code was changed.

## 3. Retesting Results

Verified the Posted Date on all three Job Details pages.

| Job Title | Posted Date | Result |
|---|---|---|
| Python Developer | 2026-11-17 | Passed |
| Frontend Developer | 2026-11-17 | Passed |
| Data Analyst | 2026-11-17 | Passed |

## 4. Conclusion

Both observations were investigated.

- Bug 1 was identified as expected behaviour caused by the sample resume footer.
- Bug 2 was resolved in the local demo database, and all three Job Details pages displayed the updated date correctly.

**Note:** The database update was tested locally. A permanent solution for fresh database installations has not yet been implemented or verified.