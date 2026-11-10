
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiClipboard } from "react-icons/fi";

import { api } from "../../api.js";
import { JobIcon, JobMeta } from "../../components/jobs.jsx";
import { Alert, EmptyState, Loading, PageHeader, StatusPill } from "../../components/ui.jsx";
import { formatDate } from "../../utils/format.js";

export default function ApplicationHistoryPage() {
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getApplications().then(setApplications).catch((err) => setError(err.message));
  }, []);

  const withdraw = async (application) => {
    if (!window.confirm(`Withdraw your application for ${application.title}?`)) return;
    try {
      await api.withdrawApplication(application.id);
      setApplications((current) => current.filter((item) => item.id !== application.id));
      setMessage("Application withdrawn.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: "Application History" }]}
        title="Application History"
        subtitle="Track the status of your job applications."
      />

      <Alert>{error}</Alert>
      <Alert type="success" onClose={() => setMessage("")}>{message}</Alert>
      {!applications && !error && <Loading />}

      {applications?.length === 0 && (
        <EmptyState
          icon={FiClipboard}
          title="No applications yet"
          text="When you apply for a job, you can follow its status here."
          action={<Link to="/recommendations" className="btn btn-primary">Find Jobs</Link>}
        />
      )}

      <div className="job-list">
        {applications?.map((application) => (
          <article className="job-row history-row" key={application.id}>
            <JobIcon category={application.category} />
            <div className="job-main">
              <h2><Link to={`/jobs/${application.job_id}`}>{application.title}</Link></h2>
              <p className="company">{application.company}</p>
              <JobMeta job={application} />
            </div>
            <div className="applied-on">
              <span>Applied on</span>
              <strong>{formatDate(application.created_at)}</strong>
            </div>
            <div className="history-status">
              <StatusPill status={application.status} />
              {application.status === "under_review" && (
                <button type="button" className="link-button small" onClick={() => withdraw(application)}>
                  Withdraw
                </button>
              )}
            </div>
            <Link to={`/jobs/${application.job_id}`} className="btn btn-outline">View Details</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
