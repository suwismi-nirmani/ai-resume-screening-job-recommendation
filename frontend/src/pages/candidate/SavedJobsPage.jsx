
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiBookmark, FiMoreVertical, FiTrash2 } from "react-icons/fi";

import { api } from "../../api.js";
import { JobIcon, JobMeta, MatchScore } from "../../components/jobs.jsx";
import { Alert, EmptyState, Loading, PageHeader, StatusPill } from "../../components/ui.jsx";
import { formatDate } from "../../utils/format.js";

function RowMenu({ onRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) =>
      ref.current && !ref.current.contains(event.target) && setOpen(false);

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="dropdown row-menu" ref={ref}>
      <button
        type="button"
        className="icon-button"
        onClick={() => setOpen((value) => !value)}
        aria-label="More options"
        aria-expanded={open}
      >
        <FiMoreVertical />
      </button>

      {open && (
        <div className="dropdown-menu">
          <button type="button" onClick={onRemove}>
            <FiTrash2 /> Remove from saved
          </button>
        </div>
      )}
    </div>
  );
}

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getSavedJobs().then(setJobs).catch((err) => setError(err.message));
  }, []);

  const remove = async (jobId) => {
    try {
      await api.unsaveJob(jobId);
      setJobs((current) => current.filter((job) => job.id !== jobId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: "Saved Jobs" }]}
        title="Saved Jobs"
        subtitle="Jobs you have saved for later. Keep track of the opportunities you're interested in."
      >
        {jobs && (
          <span className="muted">
            {jobs.length} saved {jobs.length === 1 ? "job" : "jobs"}
          </span>
        )}
      </PageHeader>

      <Alert>{error}</Alert>

      {!jobs && !error && <Loading />}

      {jobs?.length === 0 && (
        <EmptyState
          icon={FiBookmark}
          title="No saved jobs yet"
          text="Tap the bookmark icon on any job to save it here."
          action={
            <Link to="/recommendations" className="btn btn-primary">
              Browse Recommended Jobs
            </Link>
          }
        />
      )}

      <div className="job-list">
        {jobs?.map((job) => (
          <article className="job-row saved-row" key={job.id}>
            <JobIcon category={job.category} />

            <div className="job-main">
              <h2>
                <Link to={`/jobs/${job.id}`}>{job.title}</Link>
              </h2>
              <p className="company">{job.company}</p>
              <JobMeta job={job} />
            </div>

            <div className="saved-score">
              <MatchScore
                score={job.final_score}
                label={job.match_label || (job.active ? null : "Job closed")}
              />
              <span className="muted small">
                Saved on {formatDate(job.saved_at)}
              </span>
            </div>

            <div className="job-actions vertical">
              <RowMenu onRemove={() => remove(job.id)} />

              <Link to={`/jobs/${job.id}`} className="btn btn-outline">
                View Details
              </Link>

              {job.application_status ? (
                <StatusPill status={job.application_status} />
              ) : (
                job.active && (
                  <Link to={`/jobs/${job.id}/apply`} className="btn btn-primary">
                    Apply Now
                  </Link>
                )
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
