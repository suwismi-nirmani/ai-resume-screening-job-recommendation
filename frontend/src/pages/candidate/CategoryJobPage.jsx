
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiSearch,
} from "react-icons/fi";
import { PiChartBar } from "react-icons/pi";

import { api } from "../../api.js";
import { CATEGORY_STYLES, JobIcon, ScoreRing, SkillChips } from "../../components/jobs.jsx";
import { Alert, EmptyState, Loading, PageHeader } from "../../components/ui.jsx";
import { CATEGORY_DESCRIPTIONS, CATEGORY_TAGLINES, initials, timeAgo } from "../../utils/format.js";
import { SaveButton } from "./RecommendedJobsPage.jsx";

const PAGE_SIZE = 5;

function pageNumbers(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const result = [];

  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push("...");
    result.push(page);
  });

  return result;
}

export default function CategoryJobsPage() {
  const { slug } = useParams();

  const [jobs, setJobs] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    setJobs(null);
    setPage(1);

    api.getJobs({ category: slug })
      .then(setJobs)
      .catch((err) => setError(err.message));

    api.getCategories()
      .then((categories) =>
        setCategoryName(categories.find((c) => c.slug === slug)?.name || "")
      )
      .catch(() => {});
  }, [slug]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!jobs || !text) return jobs || [];

    return jobs.filter((job) =>
      [job.title, job.company, job.location, ...job.required_skills]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [jobs, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const style =
    CATEGORY_STYLES[slug] || CATEGORY_STYLES["software-development"];

  const [tagTitle, tagText] = CATEGORY_TAGLINES[slug] || ["", ""];

  const toggleSave = async (job) => {
    try {
      if (job.saved) {
        await api.unsaveJob(job.id);
      } else {
        await api.saveJob(job.id);
      }

      setJobs((current) =>
        current.map((item) =>
          item.id === job.id ? { ...item, saved: !item.saved } : item
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
          { label: "Popular Job Categories", to: "/categories" },
          { label: categoryName || "Jobs" },
        ]}
        title=""
        back={
          <Link to="/categories" className="back-link">
            <FiArrowLeft aria-hidden="true" /> Back to Categories
          </Link>
        }
      />

      <div className="category-hero">
        <JobIcon category={slug} size="lg" />

        <div>
          <h1>{categoryName}</h1>
          <p className="page-subtitle">{CATEGORY_DESCRIPTIONS[slug]}</p>
        </div>

        <div className={`category-promo tone-${style.tone}`}>
          <style.icon aria-hidden="true" />
          <div>
            <strong>{tagTitle}</strong>
            <span>{tagText}</span>
          </div>
        </div>
      </div>

      <Alert>{error}</Alert>

      {!jobs && !error && <Loading />}

      {jobs && (
        <>
          <div className="list-toolbar">
            <p className="list-count">
              {filtered.length} {filtered.length === 1 ? "job" : "jobs"} available
            </p>

            <div className="search-input">
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                placeholder="Search title, company or skill"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                aria-label="Search jobs"
              />
            </div>
          </div>

          {filtered.length === 0 && (
            <EmptyState
              icon={FiSearch}
              title="No jobs found"
              text="Try a different search."
            />
          )}

          <div className="job-list">
            {visible.map((job) => (
              <article className="job-row category-row" key={job.id}>
                <span className="company-logo" aria-hidden="true">
                  {initials(job.company)}
                </span>

                <div className="job-main">
                  <h2>
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </h2>

                  <p className="company">{job.company}</p>

                  <ul className="job-meta">
                    <li>
                      <FiMapPin aria-hidden="true" />
                      {job.work_mode === "Remote" ? "Remote" : job.location}
                    </li>

                    <li>
                      <FiBriefcase aria-hidden="true" />
                      {job.employment_type}
                    </li>

                    {job.experience_level && (
                      <li>
                        <PiChartBar aria-hidden="true" />
                        {job.experience_level}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="job-summary">
                  <p>{job.description}</p>
                  <SkillChips skills={job.required_skills.slice(0, 4)} />
                </div>

                <div className="category-row-side">
                  <span className="muted small">
                    {timeAgo(job.posted_date)}
                  </span>

                  {job.final_score !== null &&
                    job.final_score !== undefined && (
                      <span className="mini-score" title={job.match_label}>
                        <ScoreRing
                          score={job.final_score}
                          size={40}
                          stroke={4}
                        />
                      </span>
                    )}
                </div>

                <div className="job-actions vertical">
                  <SaveButton
                    saved={job.saved}
                    onToggle={() => toggleSave(job)}
                  />

                  <Link to={`/jobs/${job.id}`} className="btn btn-primary">
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filtered.length > 0 && (
            <div className="pagination-bar">
              <p className="muted">
                Showing {(page - 1) * PAGE_SIZE + 1} –{" "}
                {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length} jobs
              </p>

              <nav className="pagination" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <FiChevronLeft />
                </button>

                {pageNumbers(page, totalPages).map((number, index) =>
                  number === "..." ? (
                    <span key={`gap-${index}`} className="gap">
                      ...
                    </span>
                  ) : (
                    <button
                      type="button"
                      key={number}
                      className={number === page ? "active" : ""}
                      onClick={() => setPage(number)}
                      aria-current={number === page ? "page" : undefined}
                    >
                      {number}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <FiChevronRight />
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
