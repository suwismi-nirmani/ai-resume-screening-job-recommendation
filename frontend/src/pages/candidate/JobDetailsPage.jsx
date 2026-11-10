
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiInfo,
  FiUploadCloud,
} from "react-icons/fi";
import { PiLightbulb } from "react-icons/pi";

import { api } from "../../api.js";
import {
  JobIcon,
  JobMeta,
  ScoreBreakdown,
  ScoreRing,
  SkillChips,
} from "../../components/jobs.jsx";
import {
  Alert,
  Loading,
  PageHeader,
  StatusPill,
} from "../../components/ui.jsx";
import { formatDate, scoreTone } from "../../utils/format.js";
import { SaveButton } from "./RecommendedJobsPage.jsx";

function matchMessage(score, audience) {
  if (audience === "recruiter") {
    if (score >= 55) return "Strong match: the resume covers the job's requirements well.";
    if (score >= 40) return "Good match: worth reviewing. Check the missing skills.";
    if (score >= 25) return "Partial match: the resume covers some of the requirements.";
    return "Limited match: the resume has little overlap with this job.";
  }

  if (score >= 55) return "This job matches very well with your resume and skills. You have a strong chance of being shortlisted!";
  if (score >= 40) return "This job is a good match for your resume. Adding the missing skills could make it even stronger.";
  if (score >= 25) return "This job partly matches your resume. Review the missing skills before applying.";
  return "This job has limited overlap with your resume. Consider it if you are open to learning new skills.";
}

export function MatchPanel({ match, audience = "candidate" }) {
  return (
    <>
      <div className="final-score">
        <ScoreRing score={match.final_score} size={104} stroke={9} />
        <div>
          <h2>Final Match Score</h2>
          <p className={`match-label big tone-${scoreTone(match.final_score)}`}>
            {match.match_label}
          </p>
        </div>
      </div>

      <div className={`match-message tone-${scoreTone(match.final_score)}`}>
        <FiCheckCircle aria-hidden="true" />
        <p>{matchMessage(match.final_score, audience)}</p>
      </div>

      <h3>Score Breakdown</h3>
      <ScoreBreakdown match={match} />

      <p className="formula">
        Final score = 0.60 × text similarity + 0.40 × skill match
      </p>

      <div className="skills-split">
        <div>
          <h3>Matched Skills</h3>
          <SkillChips
            skills={match.matched_skills}
            variant="matched"
            empty="No required skills matched yet."
          />
        </div>

        <div>
          <h3>Missing Skills</h3>
          <SkillChips
            skills={match.missing_skills}
            variant="missing"
            empty={
              audience === "recruiter"
                ? "None. Every required skill is present."
                : "None. You have every required skill!"
            }
          />
        </div>
      </div>

      <div className="why-box">
        <PiLightbulb aria-hidden="true" />
        <div>
          <h3>
            {audience === "recruiter"
              ? "Why this score?"
              : "Why this job is recommended?"}
          </h3>

          <ul>
            {match.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default function JobDetailsPage() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setJob(null);
    setError("");

    api.getJob(jobId)
      .then(setJob)
      .catch((err) => setError(err.message));
  }, [jobId]);

  const toggleSave = async () => {
    try {
      if (job.saved) {
        await api.unsaveJob(job.id);
      } else {
        await api.saveJob(job.id);
      }

      setJob((current) => ({
        ...current,
        saved: !current.saved,
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const crumbs = [
    { label: "Recommended Jobs", to: "/recommendations" },
    { label: "Job Details" },
  ];

  const back = (
    <Link to="/recommendations" className="back-link top-right">
      <FiArrowLeft aria-hidden="true" /> Back to Recommended Jobs
    </Link>
  );

  if (error && !job) {
    return (
      <div className="page">
        <PageHeader crumbs={crumbs} title="Job Details" back={back} />
        <Alert>{error}</Alert>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page">
        <Loading />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader crumbs={crumbs} title="Job Details" back={back} />
      <Alert>{error}</Alert>

      <div className="details-layout">
        <section className="card job-details">
          <div className="job-details-head">
            <JobIcon category={job.category} size="lg" />

            <div className="job-main">
              <h2>{job.title}</h2>
              <p className="company">{job.company}</p>
              <JobMeta job={job} />
            </div>

            <div className="stack-actions">
              {job.application ? (
                <div className="applied-box">
                  <span className="muted small">
                    Applied on {formatDate(job.application.created_at)}
                  </span>
                  <StatusPill status={job.application.status} />
                </div>
              ) : job.active ? (
                <Link
                  to={`/jobs/${job.id}/apply`}
                  className="btn btn-primary"
                >
                  Apply Now
                </Link>
              ) : (
                <span className="status-pill status-rejected">
                  No longer accepting applications
                </span>
              )}

              <SaveButton
                saved={job.saved}
                onToggle={toggleSave}
                label
              />
            </div>
          </div>

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

          <div className="job-facts">
            <dl>
              <div>
                <dt>Employment Type</dt>
                <dd>{job.employment_type}</dd>
              </div>

              <div>
                <dt>Work Mode</dt>
                <dd>{job.work_mode}</dd>
              </div>

              {job.experience_level && (
                <div>
                  <dt>Experience Level</dt>
                  <dd>{job.experience_level}</dd>
                </div>
              )}

              {job.salary_range && (
                <div>
                  <dt>Salary Range</dt>
                  <dd>{job.salary_range}</dd>
                </div>
              )}

              <div>
                <dt>Posted Date</dt>
                <dd>{formatDate(job.posted_date)}</dd>
              </div>
            </dl>

            <div>
              <h3>Required Skills</h3>
              <SkillChips skills={job.required_skills} />

              {job.nice_to_have.length > 0 && (
                <>
                  <h3>Nice to Have</h3>
                  <SkillChips skills={job.nice_to_have} />
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="card match-panel">
          {job.match ? (
            <MatchPanel match={job.match} />
          ) : (
            <div className="empty-match">
              <FiUploadCloud aria-hidden="true" />
              <h2>See how well you match</h2>
              <p className="muted">
                Upload your resume to get a match score, matched skills and
                missing skills for this job.
              </p>
              <Link to="/upload" className="btn btn-primary">
                Upload Resume
              </Link>
            </div>
          )}

          <p className="disclaimer">
            <FiInfo aria-hidden="true" /> Scores support your decision. They
            do not guarantee shortlisting.
          </p>
        </aside>
      </div>
    </div>
  );
}
