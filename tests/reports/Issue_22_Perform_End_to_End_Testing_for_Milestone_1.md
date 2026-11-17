QA Testing Report – Milestone 1
Project: CareerMatch AI – AI-Powered ATS Resume Screening and Job Recommendation System
Issue: #22 – Perform End-to-End Testing for Milestone 1
Testing Environment: Windows 10 – Local Development Environment
Branch Tested: develop
Testing Type: Manual End-to-End Testing

1. Testing Objective
The objective of this testing was to verify the complete candidate resume screening and job recommendation workflow, starting from candidate login and PDF resume upload to resume processing, job matching, recommendations, and match score details.

2. Test Environment
Operating System: Windows 10
Development Environment: Local Development Environment
Backend: FastAPI
Frontend: React with Vite
Branch: develop
Test Data: Three sample PDF resumes with different levels of job relevance.

3. Test Cases and Results
Three sample PDF resumes were used to evaluate the system's resume screening and job recommendation functionality.

TC01 – High Match Resume
Test Input: sample_resume_high_match.pdf
Extracted Text Length: 829 characters
Skills Extracted: 15
Top Recommended Job: Python Developer
Match Score: 56%
Match Category: Great Match
Result: Passed

TC02 – Medium Match Resume
Test Input: sample_resume_medium_match.pdf
Extracted Text Length: 796 characters
Skills Extracted: 9
Top Recommended Job: Data Analyst
Match Score: 23%
Match Category: Basic Match
Result: Passed

TC03 – Low Match Resume
Test Input: sample_resume_low_match.pdf
Extracted Text Length: 706 characters
Skills Extracted: 3
Top Recommended Job: Data Analyst
Match Score: 0%
Match Category: Basic Match
Result: Passed

4. Functional Testing Results
The following functionalities were tested during the end-to-end testing process:

Candidate registration and login – Passed
PDF resume upload – Passed
PDF file validation – Passed
Resume text extraction – Passed
Skill extraction – Passed
Job retrieval – Passed
Resume-job matching – Passed
Match score calculation – Passed
Job ranking and recommendations – Passed
Recommended Jobs page – Passed
Job details page – Passed
Match score breakdown display – Passed
Matched and missing skills display – Passed

5. Match Score Verification
The match score calculation was checked using the score breakdown displayed on the Job Details pages.

The system uses the following weighted scoring formula:

Final Match Score = (Text Similarity × 60%) + (Skill Match × 40%)

TC01 – Python Developer
Text Similarity: 27.4%
Text Similarity Contribution: 16 points
Skill Match: 100%
Skill Match Contribution: 40 points
Final Match Score: 56%
All four required skills (Python, FastAPI, SQL, and Git) were matched.

TC02 – Data Analyst
Text Similarity: 5.45%
Text Similarity Contribution: 3 points
Skill Match: 50%
Skill Match Contribution: 20 points
Final Match Score: 23%
Matched Skills: SQL, Excel
Missing Skills: Python, Data Analysis

TC03 – Data Analyst
Text Similarity: 0%
Skill Match: 0%
Final Match Score: 0%
No required skills were matched. The following skills were identified as missing: Python, SQL, Excel, and Data Analysis.

6. Issues Identified
Issue 01 – Possible False-Positive Skill Extraction
The skill Software Testing was detected in all three sample resumes, although it was not included in their intended skills lists.

This may indicate that unrelated text in the resume, such as sample document footers or other boilerplate content, is being considered during skill extraction.

Recommendation: Investigate the skill extraction process and improve it to avoid detecting skills from unrelated text or sample document footers.

Issue 02 – Posted Date Not Displayed
The Posted Date field appeared blank on the Job Details pages tested.

The issue may be related to missing job data, backend response data, or frontend display handling.

Recommendation: Investigate the job data and frontend/backend handling to identify why the Posted Date is not displayed.

7. Overall Testing Conclusion
The main end-to-end resume screening and job recommendation workflow was successfully completed using three sample PDF resumes with high, medium, and low levels of job relevance.

The system successfully performed candidate login, resume uploading, PDF validation, text extraction, skill extraction, job retrieval, resume-job matching, match score calculation, job ranking, and displaying recommended jobs with match score details and matched/missing skills.

The test results demonstrated that the system could process resumes with different levels of relevance and generate corresponding job recommendations and match scores.

However, two issues were identified during testing and require further investigation by the development team.

Overall Testing Status: Core End-to-End Workflow Passed with Issues Identified.

Note: The identified issues have been documented for review and further investigation. They have not yet been confirmed as fixed.