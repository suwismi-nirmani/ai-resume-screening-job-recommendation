
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiX } from "react-icons/fi";

import { api } from "../../api.js";
import {
  Alert,
  Field,
  Loading,
  PageHeader,
} from "../../components/ui.jsx";
import { skillLabel } from "../../utils/format.js";

const EMPTY = {
  title: "",
  company: "",
  category: "software-development",
  location: "Colombo, Sri Lanka",
  employment_type: "Full-time",
  work_mode: "On-site",
  experience_level: "",
  salary_range: "",
  description: "",
  responsibilities: "",
  required_skills: [],
  nice_to_have: [],
};

const CATEGORIES = [
  ["software-development", "Software Development"],
  ["data-analysis", "Data Analysis"],
  ["ai-machine-learning", "AI / Machine Learning"],
  ["web-development", "Web Development"],
  ["internships", "Internships"],
];

function SkillInput({ label, value, onChange, error, hint }) {
  const [text, setText] = useState("");

  const add = () => {
    const parts = text
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);

    const next = [...value];

    parts.forEach((part) => {
      if (!next.includes(part)) next.push(part);
    });

    onChange(next);
    setText("");
  };

  return (
    <Field label={label} error={error} hint={hint}>
      {(id) => (
        <div>
          <div className="skill-input-row">
            <input
              id={id}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type a skill and press Enter (comma separates several)"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={add}
            >
              Add
            </button>
          </div>

          <ul className="chip-list editable">
            {value.map((skill) => (
              <li key={skill} className="chip">
                {skillLabel(skill)}
                <button
                  type="button"
                  onClick={() =>
                    onChange(value.filter((item) => item !== skill))
                  }
                  aria-label={`Remove ${skillLabel(skill)}`}
                >
                  <FiX />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Field>
  );
}

export default function JobFormPage() {
  const { jobId } = useParams();
  const editing = Boolean(jobId);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(!editing);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;

    api.recruiterJob(jobId)
      .then((job) => {
        setForm({
          ...EMPTY,
          ...job,
          responsibilities: Array.isArray(job.responsibilities)
            ? job.responsibilities.join("\n")
            : job.responsibilities || "",
        });
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [editing, jobId]);

  const update = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const found = {};

    if (form.title.trim().length < 2)
      found.title = "Enter a job title.";

    if (form.company.trim().length < 2)
      found.company = "Enter the company name.";

    if (form.location.trim().length < 2)
      found.location = "Enter a location.";

    if (form.description.trim().length < 20)
      found.description =
        "Description must be at least 20 characters.";

    if (form.required_skills.length === 0)
      found.required_skills =
        "Add at least one required skill.";

    setErrors(found);

    if (Object.keys(found).length) return;

    const body = {
      title: form.title,
      company: form.company,
      category: form.category,
      location: form.location,
      employment_type: form.employment_type,
      work_mode: form.work_mode,
      experience_level: form.experience_level,
      salary_range: form.salary_range,
      description: form.description,
      responsibilities: form.responsibilities
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      required_skills: form.required_skills,
      nice_to_have: form.nice_to_have,
    };

    setSaving(true);

    try {
      if (editing) {
        await api.updateJob(jobId, body);
      } else {
        await api.createJob(body);
      }

      navigate("/recruiter", { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const title = editing ? "Edit Job" : "Post a Job";

  return (
    <div className="page">
      <PageHeader
        crumbs={[
          { label: "Dashboard", to: "/recruiter" },
          { label: title },
        ]}
        title={title}
        subtitle="Required skills are compared with each candidate's skills to calculate the skill match (40% of the score)."
      />

      <Alert>{error}</Alert>

      {!loaded && !error && <Loading />}

      {loaded && (
        <form
          className="card job-form"
          onSubmit={submit}
          noValidate
        >
          <div className="form-grid">
            <Field label="Job Title" error={errors.title}>
              {(id) => (
                <input
                  id={id}
                  value={form.title}
                  onChange={update("title")}
                  placeholder="Software Engineer"
                />
              )}
            </Field>

            <Field label="Company" error={errors.company}>
              {(id) => (
                <input
                  id={id}
                  value={form.company}
                  onChange={update("company")}
                  placeholder="Tech Solutions (Pvt) Ltd"
                />
              )}
            </Field>

            <Field label="Category">
              {(id) => (
                <select
                  id={id}
                  value={form.category}
                  onChange={update("category")}
                >
                  {CATEGORIES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Location" error={errors.location}>
              {(id) => (
                <input
                  id={id}
                  value={form.location}
                  onChange={update("location")}
                />
              )}
            </Field>

            <Field label="Employment Type">
              {(id) => (
                <select
                  id={id}
                  value={form.employment_type}
                  onChange={update("employment_type")}
                >
                  {["Full-time", "Part-time", "Contract", "Internship"].map(
                    (value) => (
                      <option key={value}>{value}</option>
                    )
                  )}
                </select>
              )}
            </Field>

            <Field label="Work Mode">
              {(id) => (
                <select
                  id={id}
                  value={form.work_mode}
                  onChange={update("work_mode")}
                >
                  {["On-site", "Hybrid", "Remote"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Experience Level" optional>
              {(id) => (
                <input
                  id={id}
                  value={form.experience_level}
                  onChange={update("experience_level")}
                  placeholder="Entry to Mid (1-3 years)"
                />
              )}
            </Field>

            <Field label="Salary Range" optional>
              {(id) => (
                <input
                  id={id}
                  value={form.salary_range}
                  onChange={update("salary_range")}
                  placeholder="LKR 150,000 - 250,000"
                />
              )}
            </Field>
          </div>

          <Field
            label="Job Description"
            error={errors.description}
            hint="Used for TF-IDF text similarity (60% of the score). Be specific about tools and tasks."
          >
            {(id) => (
              <textarea
                id={id}
                rows={5}
                value={form.description}
                onChange={update("description")}
              />
            )}
          </Field>

          <Field
            label="Key Responsibilities"
            optional
            hint="One per line."
          >
            {(id) => (
              <textarea
                id={id}
                rows={4}
                value={form.responsibilities}
                onChange={update("responsibilities")}
              />
            )}
          </Field>

          <SkillInput
            label="Required Skills"
            value={form.required_skills}
            error={errors.required_skills}
            onChange={(skills) => {
              setForm((current) => ({
                ...current,
                required_skills: skills,
              }));
              setErrors((current) => ({
                ...current,
                required_skills: undefined,
              }));
            }}
          />

          <SkillInput
            label="Nice to Have (optional)"
            value={form.nice_to_have}
            onChange={(skills) =>
              setForm((current) => ({
                ...current,
                nice_to_have: skills,
              }))
            }
          />

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate("/recruiter")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Publish Job"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
