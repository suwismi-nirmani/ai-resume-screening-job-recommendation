
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBarChart2, FiBookmark, FiUploadCloud } from "react-icons/fi";

import { api } from "../../api.js";
import { JobIcon, JobMeta, MatchScore, RankBadge } from "../../components/jobs.jsx";
import { Alert, EmptyState, Loading, PageHeader } from "../../components/ui.jsx";
import { formatDate } from "../../utils/format.js";

const PAGE_SIZE = 10;

export function SaveButton({ saved, onToggle, label = false }) {
  return (
    <button
      type="button"
      className={`${label ? "btn btn-outline" : "icon-button bookmark"} ${saved ? "is-saved" : ""}`}
      onClick={onToggle}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved jobs" : "Save job"}
      title={saved ? "Saved" : "Save job"}
    >
      <FiBookmark aria-hidden="true" />
      {label && (saved ? "Saved" : "Save Job")}
    </button>
  );
}

export default function RecommendedJobsPage() {
  const [data, setData] = useState(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getRecommendations(limit).then(setData).catch((err) => setError(err.message));
  }, [limit]);

  const toggleSave = async (job) => {
    try {
      if (job.saved) await api.unsaveJob(job.job_id);
      else await api.saveJob(job.job_id);

      setData((current) => ({
        ...current,
        results: current.results.map((item) =>
          item.job_id === job.job_id ? { ...item, saved: !item.saved } : item
        ),
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: "Recommended Jobs" }]}
        title="Recommended Jobs"
        subtitle="Jobs ranked based on how well your resume matches the job requirements."
      >
        <div className="ai-badge">
          <FiBarChart2 aria-hidden="true" />
          <div>
            <strong>AI-Powered Recommendations</strong>
            <span>Based on your resume, skills and experience.</span>
          </div>
        </div>
      </PageHeader>

      <Alert>{error}</Alert>
      {!data && !error && <Loading text="Matching your resume with jobs..." />}

      {data && !data.resume && (
        <EmptyState
          icon={FiUploadCloud}
          title="Upload your resume to get recommendations"
          text="We compare your resume with every active job using TF-IDF, cosine similarity and skill matching."
          action={
            <Link to="/upload" className="btn btn-primary">
              Upload Resume
            </Link>
          }
        />
      )}

      {data?.resume && (
        <>
          <p className="list-caption">
            Showing {data.results.length} of {data.total} jobs · ranked using{" "}
            <strong>{data.resume.filename}</strong>{" "}
            (uploaded {formatDate(data.resume.created_at)})
          </p>

          <div className="job-list">
            {data.results.map((job) => (
              <article className="job-row" key={job.job_id}>
                <RankBadge rank={job.rank} />
                <JobIcon category={job.category} />

                <div className="job-main">
                  <h2>
                    <Link to={`/jobs/${job.job_id}`}>{job.title}</Link>
                  </h2>
                  <p className="company">{job.company}</p>
                  <JobMeta job={job} />
                </div>

                <MatchScore score={job.final_score} label={job.match_label} />

                <div className="job-actions">
                  <SaveButton
                    saved={job.saved}
                    onToggle={() => toggleSave(job)}
                  />
                  <Link to={`/jobs/${job.job_id}`} className="btn btn-primary">
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {data.results.length < data.total && (
            <div className="center">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setLimit((value) => value + PAGE_SIZE)}
              >
                Show more jobs
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
