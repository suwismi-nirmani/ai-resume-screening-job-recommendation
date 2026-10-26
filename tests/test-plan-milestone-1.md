AI Resume Screening and Job Recommendation System

Test Plan – Milestone 1

1. Introduction

The purpose of this test plan is to verify that the AI Resume Screening and Job Recommendation System works correctly. The system analyzes uploaded resumes, extracts candidate skills, matches candidates with suitable jobs, and recommends job opportunities.

2. Objectives

- Verify resume upload functionality.
- Test file validation and invalid file handling.
- Verify text extraction from resumes.
- Test candidate skill extraction.
- Verify job matching and ranking.
- Check match score calculations.
- Verify the display of recommended jobs.
- Identify defects and improve system quality.

3. Scope of Testing

Testing will cover the following features:

1. Resume Upload
2. File Validation
3. Text Extraction
4. Skill Extraction
5. Job Matching
6. Match Score
7. Result Display

4. Testing Approach

Testing will include functional testing, negative testing, input validation, API testing, user interface testing, and basic security testing.

5. Test Environment

- Operating System: Windows
- Code Editor: Visual Studio Code
- Version Control: Git and GitHub
- Application: AI Resume Screening and Job Recommendation System

6. Test Case Status

- Pass: The actual result matches the expected result.
- Fail: The actual result does not match the expected result.
- Not Executed: The test has not been performed yet.

7. Test Cases

7.1 Resume Upload and File Validation

TC001: Valid Resume Upload

- Feature: Resume Upload
- Test Steps: Open the upload page and upload a valid PDF resume.
- Input: Valid PDF file
- Expected Result: The system accepts the file and allows processing to continue.
- Actual Result: Not tested
- Status: Not Executed

TC002: Invalid File Type

- Feature: File Validation
- Test Steps: Try to upload an unsupported file type.
- Input: EXE file
- Expected Result: The system rejects the file and displays an error message.
- Actual Result: Not tested
- Status: Not Executed

TC003: Empty Upload

- Feature: File Validation
- Test Steps: Submit the upload form without selecting a file.
- Input: No file selected
- Expected Result: The system displays a validation message.
- Actual Result: Not tested
- Status: Not Executed

TC004: Corrupted Resume

- Feature: File Validation
- Test Steps: Upload a corrupted or unreadable PDF.
- Input: Corrupted PDF file
- Expected Result: The system handles the file safely and displays an error message.
- Actual Result: Not tested
- Status: Not Executed

TC005: Large File Upload

- Feature: File Validation
- Test Steps: Upload a file larger than the permitted size limit.
- Input: Oversized resume file
- Expected Result: The system rejects the file if it exceeds the configured size limit.
- Actual Result: Not tested
- Status: Not Executed

7.2 Text Extraction

TC006: Extract Text from a Valid Resume

- Feature: Text Extraction
- Test Steps: Upload a valid resume and start processing.
- Input: Resume containing readable text.
- Expected Result: The system extracts the resume text correctly.
- Actual Result: Not tested
- Status: Not Executed

TC007: Extract Text from an Empty Resume

- Feature: Text Extraction
- Test Steps: Upload a resume containing no readable text.
- Input: Empty or text-free resume.
- Expected Result: The system handles the missing text appropriately and displays an error or suitable message.
- Actual Result: Not tested
- Status: Not Executed

TC008: Extract Text from a Resume with Multiple Sections

- Feature: Text Extraction
- Test Steps: Upload a resume containing education, skills, and work experience sections.
- Input: Resume containing multiple sections.
- Expected Result: The system extracts the available text from the resume.
- Actual Result: Not tested
- Status: Not Executed

7.3 Skill Extraction

TC009: Extract Skills from a Resume

- Feature: Skill Extraction
- Test Steps: Upload a resume containing technical skills and process it.
- Input: Resume containing skills such as Java, Python, SQL, and HTML.
- Expected Result: The system identifies skills that are present in the resume.
- Actual Result: Not tested
- Status: Not Executed

TC010: Resume with No Listed Skills

- Feature: Skill Extraction
- Test Steps: Upload a resume that does not list any clear skills.
- Input: Resume without a skills section.
- Expected Result: The system handles the absence of identifiable skills appropriately.
- Actual Result: Not tested
- Status: Not Executed

TC011: Skills Written with Different Capitalization

- Feature: Skill Extraction
- Test Steps: Upload a resume containing skills written with different capitalization.
- Input: Resume containing terms such as "java", "JAVA", and "Java".
- Expected Result: The system identifies equivalent skill names consistently, if this behavior is supported.
- Actual Result: Not tested
- Status: Not Executed


7.4 Job Matching

TC012 – Match Resume with Relevant Jobs

- Feature: Job Matching
- Test Steps:
  1. Upload a resume containing skills such as Java, Python, and SQL.
  2. Run the job matching process.
- Input: A resume containing Java, Python, and SQL skills.
- Expected Result: The system recommends jobs relevant to the candidate's skills.
- Actual Result: Not tested.
- Status: Not Executed.

TC013 – Match Resume with No Relevant Jobs

- Feature: Job Matching
- Test Steps:
  1. Upload a resume containing skills that do not match the available job descriptions.
  2. Run the job matching process.
- Input: A resume containing skills not required by the available jobs.
- Expected Result: The system handles the situation correctly and displays an appropriate message if no relevant jobs are found.
- Actual Result: Not tested.
- Status: Not Executed.

TC014 – Match Resume with Multiple Jobs

- Feature: Job Matching
- Test Steps:
  1. Upload a resume containing skills that match several available jobs.
  2. Run the job matching process.
- Input: A resume that matches multiple job descriptions.
- Expected Result: The system identifies relevant jobs and displays the recommendations according to its matching logic.
- Actual Result: Not tested.
- Status: Not Executed.

7.5 Match Score

TC015 – Verify Match Score for a Relevant Job

- Feature: Match Score
- Test Steps:
  1. Upload a resume containing skills relevant to an available job.
  2. Run the job matching process.
  3. Check the match score displayed for that job.
- Input: A resume with skills matching the job description.
- Expected Result: The system displays a match score according to its scoring logic.
- Actual Result: Not tested.
- Status: Not Executed.

TC016 – Verify Match Score for a Poor Match

- Feature: Match Score
- Test Steps:
  1. Upload a resume with few or no skills matching an available job.
  2. Run the job matching process.
  3. Check the match score.
- Input: A resume with few matching skills.
- Expected Result: The system calculates and displays the score according to its matching logic.
- Actual Result: Not tested.
- Status: Not Executed.

TC017 – Verify Match Score Range

- Feature: Match Score
- Test Steps:
  1. Upload a valid resume.
  2. Run the job matching process.
  3. Check whether the displayed match score is within the permitted range.
- Input: A valid resume and available job descriptions.
- Expected Result: The match score stays within the range defined by the application.
- Actual Result: Not tested.
- Status: Not Executed.

7.6 Result Display

TC018 – Display Job Recommendations

- Feature: Result Display
- Test Steps:
  1. Upload a valid resume.
  2. Run the job matching process.
  3. Check the displayed job recommendations.
- Input: A valid resume with skills matching available jobs.
- Expected Result: The system displays relevant job recommendations clearly.
- Actual Result: Not tested.
- Status: Not Executed.

TC019 – Display Match Scores

- Feature: Result Display
- Test Steps:
  1. Upload a valid resume.
  2. Run the job matching process.
  3. Check whether each recommended job displays its match score.
- Input: A valid resume and available job descriptions.
- Expected Result: The system displays match scores correctly according to its design.
- Actual Result: Not tested.
- Status: Not Executed.

TC020 – Handle No Matching Results

- Feature: Result Display
- Test Steps:
  1. Upload a valid resume that does not match any available jobs.
  2. Run the job matching process.
  3. Check the results page.
- Input: A valid resume with no relevant job matches.
- Expected Result: The system displays an appropriate message when no matching jobs are found.
- Actual Result: Not tested.
- Status: Not Executed.



Note: The supported file formats and maximum file size must be confirmed from the actual application requirements before executing these tests.