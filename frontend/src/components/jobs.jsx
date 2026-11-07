// Job-related display pieces used across candidate and recruiter pages.

import { PiBrain, PiBuildings, PiGraduationCap } from "react-icons/pi";
import { FiBarChart2, FiBriefcase, FiCheck, FiCode, FiMapPin, FiMonitor, FiPlus, FiWifi } from "react-icons/fi";
import { scoreTone, skillLabel } from "../utils/format.js";

export const CATEGORY_STYLES = {
  "software-development": { icon: FiCode, tone: "blue" },
  "data-analysis": { icon: FiBarChart2, tone: "green" },
  "ai-machine-learning": { icon: PiBrain, tone: "purple" },
  "web-development": { icon: FiMonitor, tone: "orange" },
  internships: { icon: PiGraduationCap, tone: "pink" },
};

export function JobIcon({ category, size = "md" }) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES["software-development"];
  const Icon = style.icon;
  return (
    <div className={`job-icon tone-${style.tone} job-icon-${size}`} aria-hidden="true">
      <Icon />
    </div>
  );
}

export function JobMeta({ job, showLevel = false }) {
  const remote = job.work_mode === "Remote";
  return (
    <ul className="job-meta">
      <li>
        <FiMapPin aria-hidden="true" /> {job.location}
      </li>
      <li>
        <FiBriefcase aria-hidden="true" /> {job.employment_type}
      </li>
      <li>
        {remote ? <FiWifi aria-hidden="true" /> : <PiBuildings aria-hidden="true" />}{" "}
        {showLevel && job.experience_level ? job.experience_level : job.work_mode}
      </li>
    </ul>
  );
}

export function ScoreRing({ score, size = 76, stroke = 7 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = Math.max(0, Math.min(100, score ?? 0));
  const tone = scoreTone(score);

  return (
    <div className={`score-ring tone-${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label" style={{ fontSize: Math.round(size * 0.24) }}>
        {score === null || score === undefined ? "--" : `${Math.round(score)}%`}
      </span>
    </div>
  );
}

export function MatchScore({ score, label, size }) {
  return (
    <div className="match-score">
      <ScoreRing score={score} size={size} />
      <div>
        <span className="match-score-title">Match Score</span>
        <span className={`match-label tone-${scoreTone(score)}`}>{label || "Upload resume"}</span>
      </div>
    </div>
  );
}

export function SkillChips({ skills = [], variant = "plain", empty = "None" }) {
  if (!skills.length) return <p className="muted small">{empty}</p>;
  return (
    <ul className="chip-list">
      {skills.map((skill) => (
        <li key={skill} className={`chip chip-${variant}`}>
          {variant === "matched" && <FiCheck aria-hidden="true" />}
          {variant === "missing" && <FiPlus aria-hidden="true" />}
          {skillLabel(skill)}
        </li>
      ))}
    </ul>
  );
}

export function RankBadge({ rank }) {
  const tone = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "plain";
  return <span className={`rank-badge rank-${tone}`}>{rank}</span>;
}

export function ScoreBreakdown({ match }) {
  const rows = [
    { label: "Text Similarity", weight: "60%", raw: match.text_similarity, points: match.contribution.text_similarity, max: 60, tone: "navy" },
    { label: "Skill Match", weight: "40%", raw: match.skill_match, points: match.contribution.skill_match, max: 40, tone: "blue" },
  ];
  return (
    <div className="breakdown">
      {rows.map((row) => (
        <div className="breakdown-row" key={row.label}>
          <div className="breakdown-text">
            <span>
              {row.label} <span className="muted">({row.weight})</span>
            </span>
            <strong>{Math.round(row.points)} pts</strong>
          </div>
          <div className="bar" role="img" aria-label={`${row.label} ${row.raw}%`}>
            <span className={`bar-fill bar-${row.tone}`} style={{ width: `${(row.points / row.max) * 100}%` }} />
          </div>
          <p className="breakdown-note">
            {row.label === "Text Similarity" ? "TF-IDF cosine similarity" : "Required skills matched"}: {row.raw}%
          </p>
        </div>
      ))}
    </div>
  );
}