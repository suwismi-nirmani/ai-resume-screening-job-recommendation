
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiFile,
  FiFileText,
  FiUploadCloud,
} from "react-icons/fi";
import { PiLightbulb } from "react-icons/pi";

import { api } from "../../api.js";
import { SkillChips } from "../../components/jobs.jsx";
import { Alert, PageHeader } from "../../components/ui.jsx";
import { formatDate } from "../../utils/format.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = [".pdf", ".txt"];

const TIPS = [
  "Use an updated resume",
  "Include your skills, education and work experience",
  "Keep the file clear and readable (text-based, not scanned)",
  "Ensure the information is accurate",
];

// Same checks as the backend, so users get instant feedback.
function checkFile(file) {
  if (!file) return "Choose a file to upload.";

  const name = file.name.toLowerCase();

  if (!ALLOWED.some((extension) => name.endsWith(extension))) {
    return "Only PDF and TXT files are supported.";
  }

  if (file.size === 0) return "File is empty.";
  if (file.size > MAX_SIZE) return "Maximum file size is 5 MB.";

  return "";
}

function ResumeIllustration() {
  return (
    <svg
      viewBox="0 0 260 200"
      className="upload-illustration"
      aria-hidden="true"
    >
      <path
        d="M40 110c0-60 50-95 105-90s85 45 80 95-50 75-100 70-85-15-85-75z"
        fill="var(--blue-50)"
      />

      <rect
        x="80"
        y="30"
        width="110"
        height="140"
        rx="8"
        fill="#fff"
        stroke="var(--line)"
      />

      <circle cx="104" cy="56" r="12" fill="var(--blue-100)" />
      <circle cx="104" cy="52" r="5" fill="var(--primary)" />
      <path d="M95 64a9 6 0 0 1 18 0" fill="var(--primary)" />

      <rect x="124" y="48" width="52" height="5" rx="2.5" fill="var(--blue-100)" />
      <rect x="124" y="58" width="38" height="5" rx="2.5" fill="var(--blue-100)" />

      {[84, 96, 108, 120, 132, 144].map((y, index) => (
        <rect
          key={y}
          x="94"
          y={y}
          width={index % 2 ? 60 : 82}
          height="5"
          rx="2.5"
          fill="var(--blue-100)"
        />
      ))}

      <circle cx="186" cy="158" r="17" fill="var(--green)" />
      <path
        d="M178 158l6 6 11-12"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M220 60l10-6M224 76h10M50 80l-10-4M52 96h-10"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function UploadResumePage() {
  const inputRef = useRef(null);

  const [current, setCurrent] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    api.latestResume().then(setCurrent).catch(() => setCurrent(null));
  }, []);

  const upload = async (file) => {
    setError("");

    const problem = checkFile(file);

    if (problem) {
      setError(problem);
      return;
    }

    setUploading(true);

    try {
      const uploaded = await api.uploadResume(file);
      setResult(uploaded);
      setCurrent(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: "Upload Resume" }]}
        title="Upload Your Resume"
        subtitle="Take the first step towards your next opportunity."
      />

      {!result && (
        <div className="upload-layout">
          <div
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="dropzone-icon">
              <FiUploadCloud aria-hidden="true" />
            </span>

            <h2>
              {uploading
                ? "Analysing your resume..."
                : "Drag and drop your resume here"}
            </h2>

            <p className="muted">or</p>

            <button
              type="button"
              className="btn btn-primary btn-large"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <FiFile aria-hidden="true" />
              {uploading ? "Uploading..." : "Choose File"}
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              hidden
              onChange={(event) => upload(event.target.files?.[0])}
            />

            <p className="muted small">
              Supported formats: PDF, TXT
              <br />
              Maximum file size: 5 MB
            </p>

            <div className="dropzone-alert">
              <Alert>{error}</Alert>
            </div>
          </div>

          <div className="upload-side card soft">
            <ResumeIllustration />

            <p>
              Upload your resume and let CareerMatch AI analyze your skills,
              experience and interests to find the best job opportunities for
              you.
            </p>

            {current && (
              <div className="current-resume">
                <FiFileText aria-hidden="true" />

                <span>
                  Current resume: <strong>{current.filename}</strong>
                  <br />
                  <span className="muted small">
                    Uploaded on {formatDate(current.created_at)}. Uploading a
                    new file replaces it for matching.
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <section className="card upload-result">
          <div className="result-head">
            <FiCheckCircle className="result-check" aria-hidden="true" />

            <div>
              <h2>Resume analysed successfully</h2>
              <p className="muted">
                {result.filename} ·{" "}
                {result.character_count.toLocaleString()} characters extracted
                · {result.skill_count} skills found
              </p>
            </div>
          </div>

          <h3>Skills identified</h3>

          <SkillChips
            skills={result.skills}
            variant="matched"
            empty="No known skills were found. Add skills on your profile to improve matching."
          />

          <h3>Extracted text</h3>

          <pre className="extracted-text">{result.extracted_text}</pre>

          <div className="result-actions">
            <Link
              to="/recommendations"
              className="btn btn-primary btn-large"
            >
              View Recommended Jobs <FiArrowRight aria-hidden="true" />
            </Link>

            <Link to="/profile" className="btn btn-outline btn-large">
              Add Skills to Profile
            </Link>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setResult(null)}
            >
              Upload a different file
            </button>
          </div>
        </section>
      )}

      <div className="two-col">
        <section className="card">
          <div className="card-title-row">
            <span className="round-icon tone-amber">
              <PiLightbulb aria-hidden="true" />
            </span>
            <h2>Tips for a better match</h2>
          </div>

          <ul className="check-list">
            {TIPS.map((tip) => (
              <li key={tip}>
                <FiCheckCircle aria-hidden="true" /> {tip}
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="card-title-row">
            <span className="round-icon tone-blue">
              <FiFileText aria-hidden="true" />
            </span>
            <h2>Supported Formats</h2>
          </div>

          <div className="formats">
            <span className="format-badge pdf">PDF</span>
            <span className="format-badge txt">TXT</span>
          </div>

          <p className="muted small center">
            Text-based files only. Scanned images and password-protected PDFs
            cannot be read.
          </p>
        </section>
      </div>
    </div>
  );
}
