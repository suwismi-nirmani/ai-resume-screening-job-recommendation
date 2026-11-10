
import { useEffect, useRef, useState } from "react";
import { FiTarget, FiUploadCloud } from "react-icons/fi";

import { api } from "../../api.js";
import { ScoreRing, SkillChips } from "../../components/jobs.jsx";
import { Alert, EmptyState, Field, PageHeader } from "../../components/ui.jsx";
import { formatDate, scoreTone } from "../../utils/format.js";
import { MatchPanel } from "../candidate/JobDetailsPage.jsx";

const SOURCE_LABELS = {
  uploaded: "Uploaded by you",
  applicant: "Applicant",
  "visible profile": "Visible profile",
};

export default function ScreeningPage() {
  const fileRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadResumes = () =>
    api.screenableResumes()
      .then(setResumes)
      .catch((err) => setError(err.message));

  const loadHistory = () =>
    api.screenings()
      .then(setHistory)
      .catch(() => {});

  useEffect(() => {
    loadResumes();
    loadHistory();

    api.recruiterJobs()
      .then((rows) => setJobs(rows.filter((job) => job.active)))
      .catch((err) => setError(err.message));
  }, []);

  const uploadForScreening = async (file) => {
    if (!file) return;

    setError("");
    setBusy(true);

    try {
      const uploaded = await api.uploadResume(file);
      await loadResumes();
      setResumeId(String(uploaded.resume_id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  const run = async (event) => {
    event.preventDefault();
    setError("");

    if (!resumeId || !jobId) {
      setError("Select a resume and a job.");
      return;
    }

    setBusy(true);

    try {
      setResult(await api.screen(Number(resumeId), Number(jobId)));
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={[
          { label: "Dashboard", to: "/recruiter" },
          { label: "Resume Screening" },
        ]}
        title="Resume Screening"
        subtitle="Select a resume and one of your jobs to see the match score and skill gaps."
      />

      <Alert>{error}</Alert>

      <div className="details-layout">
        <form className="card" onSubmit={run}>
          <div className="card-title-row">
            <span className="round-icon tone-blue">
              <FiTarget aria-hidden="true" />
            </span>
            <h2>Screen a resume</h2>
          </div>

          <Field
            label="Resume"
            hint="Your uploads, applicants' resumes and candidates with visible profiles."
          >
            {(id) => (
              <select
                id={id}
                value={resumeId}
                onChange={(event) => setResumeId(event.target.value)}
              >
                <option value="">Select a resume...</option>

                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.candidate_name} · {resume.filename} (
                    {SOURCE_LABELS[resume.source] || resume.source})
                  </option>
                ))}
              </select>
            )}
          </Field>

          <div className="or-upload">
            <span>or</span>

            <button
              type="button"
              className="btn btn-outline btn-small"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              <FiUploadCloud aria-hidden="true" />
              Upload a resume (PDF/TXT)
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt"
              hidden
              onChange={(event) =>
                uploadForScreening(event.target.files?.[0])
              }
            />
          </div>

          <Field label="Job">
            {(id) => (
              <select
                id={id}
                value={jobId}
                onChange={(event) => setJobId(event.target.value)}
              >
                <option value="">Select one of your active jobs...</option>

                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} · {job.company}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-large"
            disabled={busy}
          >
            {busy ? "Working..." : "Run Screening"}
          </button>
        </form>

        <aside className="card match-panel">
          {result ? (
            <>
              <p className="screen-subject">
                <strong>{result.resume.candidate_name}</strong> for{" "}
                <strong>{result.job.title}</strong>
              </p>

              <MatchPanel match={result.result} audience="recruiter" />

              <h3>All skills found in resume</h3>
              <SkillChips skills={result.resume.skills} />
            </>
          ) : (
            <EmptyState
              icon={FiTarget}
              title="No screening yet"
              text="Results show the final score, the 60/40 breakdown, matched and missing skills, and reasons."
            />
          )}
        </aside>
      </div>

      {history.length > 0 && (
        <section className="card">
          <h2>Recent Screenings</h2>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resume</th>
                  <th>Job</th>
                  <th>Text</th>
                  <th>Skills</th>
                  <th>Final</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {history.map((row) => (
                  <tr key={row.id}>
                    <td>{row.filename}</td>
                    <td>{row.job_title}</td>
                    <td>{row.text_similarity}%</td>
                    <td>{row.skill_match}%</td>
                    <td>
                      <span className="inline-score">
                        <ScoreRing
                          score={row.final_score}
                          size={34}
                          stroke={4}
                        />
                        <span
                          className={`match-label tone-${scoreTone(
                            row.final_score
                          )}`}
                        >
                          {row.final_score}%
                        </span>
                      </span>
                    </td>
                    <td className="nowrap">
                      {formatDate(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
