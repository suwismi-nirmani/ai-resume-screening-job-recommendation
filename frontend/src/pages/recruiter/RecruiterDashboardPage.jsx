
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiClock,
  FiEdit2,
  FiPlusCircle,
  FiTarget,
  FiUsers,
} from "react-icons/fi";

import { api } from "../../api.js";
import { JobIcon } from "../../components/jobs.jsx";
import { Alert, EmptyState, Loading } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { firstName, formatDate } from "../../utils/format.js";

export default function RecruiterDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  const load = () => {
    api.recruiterStats()
      .then(setStats)
      .catch((err) => setError(err.message));

    api.recruiterJobs()
      .then(setJobs)
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const toggleActive = async (job) => {
    const action = job.active ? "deactivate" : "reactivate";

    if (!window.confirm(`Do you want to ${action} "${job.title}"?`))
      return;

    try {
      await api.setJobActive(job.id, !job.active);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const visible = (jobs || []).filter((job) =>
    filter === "all"
      ? true
      : filter === "active"
        ? job.active
        : !job.active
  );

  const cards = stats && [
    {
      icon: FiBriefcase,
      tone: "blue",
      label: "Active jobs",
      value: stats.active_jobs,
      sub: `${stats.total_jobs} total`,
    },
    {
      icon: FiUsers,
      tone: "green",
      label: "Applications",
      value: stats.applications,
      sub: "across your jobs",
    },
    {
      icon: FiClock,
      tone: "orange",
      label: "Pending review",
      value: stats.pending_review,
      sub: "need a decision",
    },
    {
      icon: FiTarget,
      tone: "purple",
      label: "Screenings run",
      value: stats.screenings,
      sub: "resume vs job",
    },
  ];

  return (
    <div className="page">
      <section className="welcome-banner recruiter">
        <div className="welcome-text">
          <h1>Welcome Back, {firstName(user.full_name)}!</h1>

          <p>
            Manage your job postings and screen resumes with
            explainable match scores.
          </p>

          <div className="banner-actions">
            <Link
              to="/recruiter/jobs/new"
              className="btn btn-primary btn-large"
            >
              <FiPlusCircle aria-hidden="true" /> Post a Job
            </Link>

            <Link
              to="/recruiter/screening"
              className="btn btn-outline btn-large"
            >
              <FiTarget aria-hidden="true" /> Screen a Resume
            </Link>
          </div>
        </div>
      </section>

      <Alert>{error}</Alert>

      <section className="stat-grid">
        {cards?.map((card) => (
          <div
            className={`stat-card tone-${card.tone}`}
            key={card.label}
          >
            <span className="quick-icon">
              <card.icon aria-hidden="true" />
            </span>

            <div>
              <strong>{card.value}</strong>
              <span>{card.label}</span>
              <span className="muted small">{card.sub}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card-heading">
          <div>
            <h2>My Job Postings</h2>
            <p className="muted">
              Create, edit, deactivate and review applicants
              for your jobs.
            </p>
          </div>

          <div
            className="segmented"
            role="group"
            aria-label="Filter jobs"
          >
            {["all", "active", "inactive"].map((value) => (
              <button
                type="button"
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {!jobs && <Loading />}

        {jobs?.length === 0 && (
          <EmptyState
            icon={FiBriefcase}
            title="No jobs posted yet"
            text="Post your first job to start receiving applications."
            action={
              <Link
                to="/recruiter/jobs/new"
                className="btn btn-primary"
              >
                Post a Job
              </Link>
            }
          />
        )}

        {visible.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Category</th>
                  <th>Posted</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {visible.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="table-job">
                        <JobIcon
                          category={job.category}
                          size="sm"
                        />

                        <div>
                          <strong>{job.title}</strong>
                          <span className="muted small">
                            {job.company} · {job.location}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{job.category_name}</td>

                    <td className="nowrap">
                      {formatDate(job.posted_date)}
                    </td>

                    <td>
                      <Link
                        to={`/recruiter/applicants?job=${job.id}`}
                        className="text-link"
                      >
                        {job.application_count}
                      </Link>
                    </td>

                    <td>
                      <span
                        className={`status-pill ${
                          job.active
                            ? "status-shortlisted"
                            : "status-closed"
                        }`}
                      >
                        {job.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="table-actions">
                      <Link
                        to={`/recruiter/jobs/${job.id}/edit`}
                        className="btn btn-soft btn-small"
                      >
                        <FiEdit2 aria-hidden="true" /> Edit
                      </Link>

                      <button
                        type="button"
                        className={`btn btn-small ${
                          job.active
                            ? "btn-danger-outline"
                            : "btn-outline"
                        }`}
                        onClick={() => toggleActive(job)}
                      >
                        {job.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
