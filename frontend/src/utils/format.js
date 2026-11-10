// Display helpers shared by many pages.

const SKILL_NAMES = {
  sql: "SQL", mysql: "MySQL", postgresql: "PostgreSQL", sqlite: "SQLite", mongodb: "MongoDB",
  html: "HTML", css: "CSS", javascript: "JavaScript", typescript: "TypeScript",
  "node.js": "Node.js", "express.js": "Express.js", ".net": ".NET", "c#": "C#", "c++": "C++",
  php: "PHP", aws: "AWS", nlp: "NLP", "ui/ux": "UI/UX", "ci/cd": "CI/CD", github: "GitHub",
  fastapi: "FastAPI", "power bi": "Power BI", "scikit-learn": "scikit-learn", pytorch: "PyTorch",
  tensorflow: "TensorFlow", numpy: "NumPy", "rest api": "REST API", "tailwind css": "Tailwind CSS",
};

export function skillLabel(skill) {
  if (!skill) return "";
  if (SKILL_NAMES[skill]) return SKILL_NAMES[skill];
  return skill.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstName(name = "") {
  return name.trim().split(/\s+/)[0] || "there";
}

// SQLite returns "2026-08-20 10:15:00" (UTC) or "2026-08-20".
function parseDate(value) {
  if (!value) return null;
  const text = String(value);
  const iso = text.length > 10 ? `${text.replace(" ", "T")}Z` : `${text}T00:00:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function timeAgo(value) {
  const date = parseDate(value);
  if (!date) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(value);
}

export function scoreTone(score) {
  if (score === null || score === undefined) return "none";
  if (score >= 55) return "high";
  if (score >= 40) return "good";
  if (score >= 25) return "medium";
  return "low";
}

export const STATUS_LABELS = {
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
};

export const CATEGORY_DESCRIPTIONS = {
  "software-development": "Explore software development jobs and find the right opportunity for you.",
  "data-analysis": "Turn data into decisions. Explore analyst and data engineering roles.",
  "ai-machine-learning": "Build intelligent systems. Explore machine learning and AI roles.",
  "web-development": "Design and build the web. Explore frontend, backend and full stack roles.",
  internships: "Start your career with hands-on internship opportunities.",
};

export const CATEGORY_TAGLINES = {
  "software-development": ["Build. Create. Innovate.", "Join top companies and work on exciting projects."],
  "data-analysis": ["Find the story in the data.", "Help teams make smarter decisions every day."],
  "ai-machine-learning": ["Shape the future with AI.", "Work on models that solve real problems."],
  "web-development": ["Craft great web experiences.", "Build products people use every day."],
  internships: ["Learn by doing.", "Gain real experience with supportive teams."],
};
