
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiBriefcase, FiCheckCircle, FiFileText, FiMessageSquare, FiUser } from "react-icons/fi";

import { api } from "../../api.js";
import { JobIcon, JobMeta, ScoreRing, SkillChips } from "../../components/jobs.jsx";
import { Alert, Field, Loading, PageHeader } from "../../components/ui.jsx";
import { formatDate, scoreTone } from "../../utils/format.js";

const COVER_LIMIT = 500;

export default function ApplyPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [resume, setResume] = useState(undefined);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", cover_letter: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.getJob(jobId).then(setJob).catch((err) => setError(err.message));
    api.latestResume().then(setResume).catch(() => setResume(null));
    api.getProfile()
      .then(({ user }) => setForm((current) => ({
        ...current,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
      })))
      .catch(() => {});
  }, [jobId]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const found = {};

    if (form.full_name.trim().length < 2) {
      found.full_name = "Enter your full name.";
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      found.email = "Enter a valid email address.";
    }

    if (form.phone && !/^[0-9+()\-\s]{7,30}$/.test(form.phone)) {
      found.phone = "Enter a valid phone number.";
    }

    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);

    try {
      await api.apply({ job_id: Number(jobId), ...form });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const crumbs = [
    { label: "Recommended Jobs", to: "/recommendations" },
    { label: "Job Details", to: `/jobs/${jobId}` },
    { label: "Apply Now" },
  ];

  if (!job && !error) {
    return <div className="page"><Loading /></div>;
  }

  if (done) {
    return (
      <div className="page">
        <PageHeader crumbs={crumbs} title="Application Submitted" />
        <section className="card success-card">
          <FiCheckCircle className="success-icon" aria-hidden="true" />
          <h2>Your application for {job.title} has been sent!</h2>
          <p className="muted">
            {job.company} will review it. You can follow its status in Application History.
          </p>
          <div className="result-actions">
            <Link to="/applications" className="btn btn-primary">View Application History</Link>
            <Link to="/recommendations" className="btn btn-outline">Browse More Jobs</Link>
          </div>
        </section>
      </div>
    );
  }

  const alreadyApplied = Boolean(job?.application);

  return (
    <div className="page">
      <PageHeader
        crumbs={crumbs}
        title="Apply for this Job"
        subtitle="Review your details and submit your application."
      />

      <Alert>{error}</Alert>

      {job && (
        <div className="details-layout apply-layout">
          <form className="card" onSubmit={handleSubmit} noValidate>
            <div className="card-title-row">
              <FiUser className="title-icon" aria-hidden="true" />
              <h2>Application Details</h2>
            </div>

            {alreadyApplied && (
              <Alert type="info">You have already applied for this job.</Alert>
            )}

            <Field label="Full Name" error={errors.full_name}>
              {(id) => (
                <input
                  id={id}
                  value={form.full_name}
                  onChange={update("full_name")}
                  autoComplete="name"
                />
              )}
            </Field>

            <Field label="Email Address" error={errors.email}>
              {(id) => (
                <input
                  id={id}
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                />
              )}
            </Field>

            <Field label="Phone Number" error={errors.phone} optional>
              {(id) => (
                <input
                  id={id}
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+94 77 123 4567"
                  autoComplete="tel"
                />
              )}
            </Field>

            <div className="card-title-row small-gap">
              <FiFileText className="title-icon" aria-hidden="true" />
              <h3>Resume</h3>
            </div>

            {resume === undefined && <Loading text="Checking your resume..." />}

            {resume === null && (
              <Alert type="info">
                You need to upload a resume before applying. <Link to="/upload">Upload resume</Link>
              </Alert>
            )}

            {resume && (
              <div className="attached-file">
                <span className={`file-badge ${resume.filename.toLowerCase().endsWith(".pdf") ? "pdf" : "txt"}`}>
                  {resume.filename.toLowerCase().endsWith(".pdf") ? "PDF" : "TXT"}
                </span>
                <span>
                  <strong>{resume.filename}</strong>
                  <span className="muted small">
                    Uploaded on {formatDate(resume.created_at)}
                  </span>
                </span>
                <span className="attached-pill">
                  <FiCheckCircle aria-hidden="true" /> Attached
                </span>
              </div>
            )}

            <div className="card-title-row small-gap">
              <FiMessageSquare className="title-icon" aria-hidden="true" />
              <h3>Cover Letter <span className="optional">(Optional)</span></h3>
            </div>

            <div className="textarea-wrap">
              <textarea
                rows={4}
                maxLength={COVER_LIMIT}
                value={form.cover_letter}
                onChange={update("cover_letter")}
                placeholder="Write a short cover letter (optional)..."
                aria-label="Cover letter"
              />
              <span className="char-count">
                {form.cover_letter.length}/{COVER_LIMIT}
              </span>
            </div>

            <div className="form-actions spread">
              <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !resume || alreadyApplied || !job.active}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>

          <aside className="card">
            <div className="card-title-row">
              <FiBriefcase className="title-icon" aria-hidden="true" />
              <h2>Job Summary</h2>
            </div>

            <div className="summary-head">
              <JobIcon category={job.category} size="lg" />
              <div>
                <h3>{job.title}</h3>
                <p className="company">{job.company}</p>
                <JobMeta job={job} />
              </div>
            </div>

            <hr />
            <h3>Job Description</h3>
            <p className="body-text">{job.description}</p>

            {job.responsibilities.length > 0 && (
              <>
                <h3>Key Responsibilities</h3>
                <ul className="bullet-list">
                  {job.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            <hr />
            <h3>Required Skills</h3>
            <SkillChips skills={job.required_skills} />

            {job.match && (
              <div className="summary-score">
                <ScoreRing score={job.match.final_score} size={80} />
                <div>
                  <span className="match-score-title">Your Match Score</span>
                  <span className={`match-label big tone-${scoreTone(job.match.final_score)}`}>
                    {job.match.match_label}
                  </span>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
