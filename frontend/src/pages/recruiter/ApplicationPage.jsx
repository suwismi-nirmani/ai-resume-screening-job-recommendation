
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiMail, FiPhone, FiUsers } from "react-icons/fi";

import { api } from "../../api.js";
import { ScoreRing, SkillChips } from "../../components/jobs.jsx";
import {
  Alert,
  EmptyState,
  Loading,
  PageHeader,
} from "../../components/ui.jsx";
import { formatDate } from "../../utils/format.js";

export default function ApplicantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const jobFilter = searchParams.get("job") || "";

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.recruiterJobs()
      .then(setJobs)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setApplications(null);
    api.recruiterApplications(jobFilter)
      .then(setApplications)
      .catch((err) => setError(err.message));
  }, [jobFilter]);

  const changeStatus = async (application, status) => {
    try {
      await api.setApplicationStatus(application.id, status);

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? { ...item, status }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={[
          { label: "Dashboard", to: "/recruiter" },
          { label: "Applicants" },
        ]}
        title="Applicants"
        subtitle="Applications for your jobs, ordered by match score. You make the final decision."
      >
        <select
          className="filter-select"
          value={jobFilter}
          aria-label="Filter by job"
          onChange={(event) =>
            setSearchParams(
              event.target.value
                ? { job: event.target.value }
                : {}
            )
          }
        >
          <option value="">All jobs</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>
      </PageHeader>

      <Alert>{error}</Alert>

      {!applications && !error && <Loading />}

      {applications?.length === 0 && (
        <EmptyState
          icon={FiUsers}
          title="No applications yet"
          text="Applications for your jobs will appear here."
        />
      )}

      <div className="job-list">
        {applications?.map((application) => (
          <article
            className="applicant-row card"
            key={application.id}
          >
            <div className="applicant-main">
              <ScoreRing
                score={application.final_score}
                size={60}
                stroke={6}
              />

              <div>
                <h2>{application.full_name}</h2>

                <p className="muted">
                  Applied for{" "}
                  <strong>{application.job_title}</strong>{" "}
                  on {formatDate(application.created_at)}
                </p>

                <ul className="job-meta">
                  <li>
                    <FiMail aria-hidden="true" />{" "}
                    {application.email}
                  </li>

                  {application.phone && (
                    <li>
                      <FiPhone aria-hidden="true" />{" "}
                      {application.phone}
                    </li>
                  )}
                </ul>
              </div>

              <label className="status-select">
                <span className="sr-only">Status</span>

                <select
                  value={application.status}
                  onChange={(event) =>
                    changeStatus(
                      application,
                      event.target.value
                    )
                  }
                  className={`status-${application.status}`}
                >
                  <option value="under_review">
                    Under Review
                  </option>
                  <option value="shortlisted">
                    Shortlisted
                  </option>
                  <option value="rejected">
                    Rejected
                  </option>
                </select>
              </label>
            </div>

            <SkillChips
              skills={application.resume_skills}
              empty="Resume skills unavailable."
            />

            {application.cover_letter && (
              <button
                type="button"
                className="link-button small"
                onClick={() =>
                  setExpanded(
                    expanded === application.id
                      ? null
                      : application.id
                  )
                }
              >
                {expanded === application.id
                  ? "Hide cover letter"
                  : "Show cover letter"}
              </button>
            )}

            {expanded === application.id && (
              <p className="cover-letter">
                {application.cover_letter}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
