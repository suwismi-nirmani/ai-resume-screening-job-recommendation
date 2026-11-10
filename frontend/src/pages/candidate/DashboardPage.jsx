
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiFileText,
  FiSearch,
  FiUpload,
  FiUser,
} from "react-icons/fi";
import { PiHandWaving } from "react-icons/pi";

import bannerImage from "../../assets/banner-dashboard.jpg";
import { api } from "../../api.js";
import { CATEGORY_STYLES, JobIcon, MatchScore } from "../../components/jobs.jsx";
import { Alert } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { firstName } from "../../utils/format.js";

const QUICK_LINKS = [
  {
    to: "/upload",
    icon: FiFileText,
    tone: "blue",
    title: "Upload Resume",
    text: "Get started by uploading your resume (PDF or TXT).",
  },
  {
    to: "/recommendations",
    icon: FiSearch,
    tone: "green",
    title: "Find Jobs",
    text: "Get personalized job recommendations.",
  },
  {
    to: "/profile",
    icon: FiUser,
    tone: "purple",
    title: "My Profile",
    text: "Keep your information up to date.",
  },
];

export function CategoryCard({ category, showArrow = false }) {
  const style = CATEGORY_STYLES[category.slug];

  return (
    <Link
      to={`/categories/${category.slug}`}
      className={`category-card tone-${style.tone}`}
    >
      <span className="category-icon">
        <style.icon aria-hidden="true" />
      </span>

      <strong>{category.name}</strong>

      <span className="category-count">
        {category.job_count} {category.job_count === 1 ? "job" : "jobs"}
        {showArrow && <FiArrowRight aria-hidden="true" />}
      </span>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message));

    api.getRecommendations(3)
      .then(setRecommendations)
      .catch(() => setRecommendations(null));
  }, []);

  const hasResume = Boolean(recommendations?.resume);

  return (
    <div className="page">
      <section className="welcome-banner">
        <div className="welcome-text">
          <h1>
            Welcome Back,
            <br />
            {firstName(user.full_name)}!
            <PiHandWaving className="wave" aria-hidden="true" />
          </h1>

          <p>Find your right job, Build your future.</p>

          <Link
            to={hasResume ? "/recommendations" : "/upload"}
            className="btn btn-primary btn-large"
          >
            {hasResume ? (
              <FiSearch aria-hidden="true" />
            ) : (
              <FiUpload aria-hidden="true" />
            )}

            {hasResume ? "View Recommended Jobs" : "Upload Your Resume"}

            <FiArrowRight aria-hidden="true" />
          </Link>
        </div>

        <img src={bannerImage} alt="" className="welcome-image" />
      </section>

      <Alert>{error}</Alert>

      <section className="quick-links">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`quick-link tone-${link.tone}`}
          >
            <span className="quick-icon">
              <link.icon aria-hidden="true" />
            </span>

            <span className="quick-text">
              <strong>{link.title}</strong>
              <span>{link.text}</span>
            </span>

            <span className="quick-arrow">
              <FiArrowRight aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>

      {hasResume && recommendations.results.length > 0 && (
        <section className="card">
          <div className="card-heading">
            <div>
              <h2>Your Top Matches</h2>
              <p className="muted">
                Based on {recommendations.resume.filename}
              </p>
            </div>

            <Link to="/recommendations" className="text-link">
              View All <FiArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="top-matches">
            {recommendations.results.map((job) => (
              <Link
                key={job.job_id}
                to={`/jobs/${job.job_id}`}
                className="top-match"
              >
                <JobIcon category={job.category} size="sm" />

                <span className="top-match-text">
                  <strong>{job.title}</strong>
                  <span className="muted">{job.company}</span>
                </span>

                <MatchScore
                  score={job.final_score}
                  label={job.match_label}
                  size={56}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-heading">
          <div>
            <h2>Popular Job Categories</h2>
            <p className="muted">
              Explore job opportunities in top fields.
            </p>
          </div>

          <Link to="/categories" className="text-link">
            View All <FiArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className="category-grid four">
          {categories.slice(0, 4).map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}
