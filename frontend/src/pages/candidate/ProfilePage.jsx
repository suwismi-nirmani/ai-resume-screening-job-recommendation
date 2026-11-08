
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiEdit2,
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";
import { PiGraduationCap } from "react-icons/pi";

import { api } from "../../api.js";
import { SkillChips } from "../../components/jobs.jsx";
import {
  Alert,
  Field,
  Loading,
  Modal,
  PageHeader,
} from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { initials, skillLabel } from "../../utils/format.js";

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  onEdit,
  editLabel = "Edit",
  children,
}) {
  return (
    <section className="card profile-card">
      <div className="profile-card-head">
        <span className="round-icon tone-blue">
          <Icon aria-hidden="true" />
        </span>

        <div>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>

        {onEdit && (
          <button
            type="button"
            className="btn btn-soft btn-small"
            onClick={onEdit}
          >
            {editLabel === "Add" ? (
              <FiPlus aria-hidden="true" />
            ) : (
              <FiEdit2 aria-hidden="true" />
            )}
            {editLabel}
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

function EmptyBlock({ icon: Icon, text, action, onClick }) {
  return (
    <div className="empty-block">
      <Icon aria-hidden="true" />
      <p>{text}</p>
      <button
        type="button"
        className="btn btn-outline btn-small"
        onClick={onClick}
      >
        <FiPlus aria-hidden="true" /> {action}
      </button>
    </div>
  );
}

function PersonalForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState({
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    location: user.location,
    current_status: user.current_status,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) =>
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="inline-form">
      <Alert>{error}</Alert>

      <div className="form-grid">
        <Field label="Full Name">
          {(id) => (
            <input
              id={id}
              value={form.full_name}
              onChange={update("full_name")}
              required
            />
          )}
        </Field>

        <Field label="Email Address">
          {(id) => (
            <input
              id={id}
              type="email"
              value={form.email}
              onChange={update("email")}
              required
            />
          )}
        </Field>

        <Field label="Phone Number">
          {(id) => (
            <input
              id={id}
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              placeholder="+94 77 123 4567"
            />
          )}
        </Field>

        <Field label="Location">
          {(id) => (
            <input
              id={id}
              value={form.location}
              onChange={update("location")}
              placeholder="Colombo, Sri Lanka"
            />
          )}
        </Field>

        <Field label="Current Status">
          {(id) => (
            <select
              id={id}
              value={form.current_status}
              onChange={update("current_status")}
            >
              <option value="">Select...</option>
              <option>Student</option>
              <option>Graduate</option>
              <option>Employed</option>
              <option>Looking for work</option>
            </select>
          )}
        </Field>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

function EducationModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({
    degree: record?.degree || "",
    institution: record?.institution || "",
    graduation_year: record?.graduation_year || "",
    cgpa: record?.cgpa ?? "",
  });

  const [error, setError] = useState("");

  const update = (field) => (event) =>
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();

    const body = {
      degree: form.degree,
      institution: form.institution,
      graduation_year: form.graduation_year
        ? Number(form.graduation_year)
        : null,
      cgpa: form.cgpa === "" ? null : Number(form.cgpa),
    };

    try {
      onSaved(
        record
          ? await api.updateEducation(record.id, body)
          : await api.addEducation(body)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      title={record ? "Edit Education" : "Add Education"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <Alert>{error}</Alert>

        <Field label="Degree">
          {(id) => (
            <input
              id={id}
              value={form.degree}
              onChange={update("degree")}
              placeholder="BSc in Computer Science"
              required
            />
          )}
        </Field>

        <Field label="Institution">
          {(id) => (
            <input
              id={id}
              value={form.institution}
              onChange={update("institution")}
              placeholder="University of Colombo"
              required
            />
          )}
        </Field>

        <div className="form-grid">
          <Field label="Graduation Year" optional>
            {(id) => (
              <input
                id={id}
                type="number"
                min="1950"
                max="2100"
                value={form.graduation_year}
                onChange={update("graduation_year")}
              />
            )}
          </Field>

          <Field label="CGPA" optional>
            {(id) => (
              <input
                id={id}
                type="number"
                step="0.01"
                min="0"
                max="4.5"
                value={form.cgpa}
                onChange={update("cgpa")}
              />
            )}
          </Field>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>

          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ExperienceModal({ record, onClose, onSaved }) {
  const [form, setForm] = useState({
    job_title: record?.job_title || "",
    company: record?.company || "",
    start_date: record?.start_date || "",
    end_date: record?.end_date || "",
    description: record?.description || "",
  });

  const [error, setError] = useState("");

  const update = (field) => (event) =>
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();

    try {
      onSaved(
        record
          ? await api.updateExperience(record.id, form)
          : await api.addExperience(form)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      title={record ? "Edit Experience" : "Add Experience"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <Alert>{error}</Alert>

        <Field label="Job Title">
          {(id) => (
            <input
              id={id}
              value={form.job_title}
              onChange={update("job_title")}
              placeholder="Software Engineering Intern"
              required
            />
          )}
        </Field>

        <Field label="Company">
          {(id) => (
            <input
              id={id}
              value={form.company}
              onChange={update("company")}
              required
            />
          )}
        </Field>

        <div className="form-grid">
          <Field label="Start" optional>
            {(id) => (
              <input
                id={id}
                type="month"
                value={form.start_date}
                onChange={update("start_date")}
              />
            )}
          </Field>

          <Field label="End" optional hint="Leave empty if current">
            {(id) => (
              <input
                id={id}
                type="month"
                value={form.end_date}
                onChange={update("end_date")}
              />
            )}
          </Field>
        </div>

        <Field label="Description" optional>
          {(id) => (
            <textarea
              id={id}
              rows={3}
              maxLength={1000}
              value={form.description}
              onChange={update("description")}
            />
          )}
        </Field>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>

          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SkillsModal({ skills, suggestions, onClose, onSaved }) {
  const [list, setList] = useState(skills);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const add = (value) => {
    const skill = value.trim().toLowerCase();

    if (skill && !list.includes(skill)) {
      setList((current) => [...current, skill]);
    }

    setText("");
  };

  const save = async () => {
    try {
      onSaved(await api.updateSkills(list));
    } catch (err) {
      setError(err.message);
    }
  };

  const unused = suggestions.filter((skill) => !list.includes(skill));

  return (
    <Modal
      title="Edit Skills"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
          >
            Save Skills
          </button>
        </>
      }
    >
      <Alert>{error}</Alert>

      <div className="skill-input-row">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a skill and press Enter"
          aria-label="New skill"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(text);
            }
          }}
        />

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => add(text)}
        >
          Add
        </button>
      </div>

      <ul className="chip-list editable">
        {list.map((skill) => (
          <li key={skill} className="chip">
            {skillLabel(skill)}

            <button
              type="button"
              onClick={() =>
                setList((current) =>
                  current.filter((item) => item !== skill)
                )
              }
              aria-label={`Remove ${skillLabel(skill)}`}
            >
              <FiX />
            </button>
          </li>
        ))}

        {list.length === 0 && (
          <li className="muted small">No skills added yet.</li>
        )}
      </ul>

      {unused.length > 0 && (
        <>
          <p className="muted small">
            Found in your resume (click to add):
          </p>

          <ul className="chip-list">
            {unused.map((skill) => (
              <li key={skill}>
                <button
                  type="button"
                  className="chip chip-suggest"
                  onClick={() => add(skill)}
                >
                  <FiPlus aria-hidden="true" /> {skillLabel(skill)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}

export default function ProfilePage() {
  const { setUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    api.getProfile()
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, []);

  const applyProfile = (updated, note) => {
    setProfile(updated);
    setUser(updated.user);
    setModal(null);

    if (note) {
      setMessage(note);
    }
  };

  const removeRecord = async (type, id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      applyProfile(
        type === "education"
          ? await api.deleteEducation(id)
          : await api.deleteExperience(id),
        "Record deleted."
      );
    } catch (err) {
      setError(err.message);
    }
  };

  if (!profile) {
    return (
      <div className="page">
        {error ? <Alert>{error}</Alert> : <Loading />}
      </div>
    );
  }

  const { user, education, experience, skills, resume, completion } = profile;
  const complete = completion === 100;
  const latestEducation = education[0];

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ label: "My Profile" }]}
        title="My Profile"
        subtitle={
          complete
            ? "Your profile is complete. Keep it updated for better job recommendations."
            : "Manage your account information and build your profile to get better job recommendations."
        }
      >
        {complete && (
          <div className="complete-badge">
            <FiCheckCircle aria-hidden="true" />
            <div>
              <strong>Profile Completed</strong>
              <span>All details have been updated.</span>
            </div>
          </div>
        )}
      </PageHeader>

      <Alert>{error}</Alert>
      <Alert type="success" onClose={() => setMessage("")}>
        {message}
      </Alert>

      <section className="profile-hero">
        <span className="avatar xl">{initials(user.full_name)}</span>

        <div className="profile-hero-text">
          <h2>{user.full_name}</h2>
          <p>{user.email}</p>

          <ul className="job-meta">
            {user.location && (
              <li>
                <FiMapPin aria-hidden="true" /> {user.location}
              </li>
            )}

            {user.current_status && (
              <li>
                <PiGraduationCap aria-hidden="true" /> {user.current_status}
              </li>
            )}

            {latestEducation && (
              <li>
                <PiGraduationCap aria-hidden="true" /> {latestEducation.institution}
              </li>
            )}
          </ul>
        </div>

        {complete ? (
          <div className="profile-quote">
            “A Brighter Career Awaits You”
          </div>
        ) : (
          <div className="completion-box">
            <strong>Complete your profile</strong>

            <span>
              Add your education, experience and skills to get personalized
              job recommendations.
            </span>

            <div
              className="bar"
              role="progressbar"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className="bar-fill bar-blue"
                style={{ width: `${completion}%` }}
              />
            </div>

            <span className="muted small">
              {completion}% complete
            </span>
          </div>
        )}
      </section>

      <div className="profile-grid">
        <SectionCard
          icon={FiUser}
          title="Personal Information"
          subtitle="Your basic details."
          onEdit={editingPersonal ? null : () => setEditingPersonal(true)}
        >
          {editingPersonal ? (
            <PersonalForm
              user={user}
              onCancel={() => setEditingPersonal(false)}
              onSave={async (form) => {
                applyProfile(
                  await api.updateProfile(form),
                  "Personal information saved."
                );
                setEditingPersonal(false);
              }}
            />
          ) : (
            <dl className="detail-list">
              <div>
                <dt>Full Name</dt>
                <dd>{user.full_name}</dd>
              </div>

              <div>
                <dt>Email Address</dt>
                <dd>{user.email}</dd>
              </div>

              <div>
                <dt>Phone Number</dt>
                <dd>
                  {user.phone || (
                    <span className="muted">Not added</span>
                  )}
                </dd>
              </div>

              <div>
                <dt>Location</dt>
                <dd>
                  {user.location || (
                    <span className="muted">Not added</span>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </SectionCard>

        <SectionCard
          icon={PiGraduationCap}
          title="Education"
          subtitle="Your educational background."
          onEdit={
            education.length
              ? () => setModal({ type: "education" })
              : null
          }
          editLabel="Add"
        >
          {education.length === 0 ? (
            <EmptyBlock
              icon={PiGraduationCap}
              text="No educational details added yet."
              action="Add Education"
              onClick={() => setModal({ type: "education" })}
            />
          ) : (
            education.map((record) => (
              <div className="record" key={record.id}>
                <dl className="detail-list">
                  <div>
                    <dt>Degree</dt>
                    <dd>{record.degree}</dd>
                  </div>

                  <div>
                    <dt>Institution</dt>
                    <dd>{record.institution}</dd>
                  </div>

                  {record.graduation_year && (
                    <div>
                      <dt>Graduation Year</dt>
                      <dd>{record.graduation_year}</dd>
                    </div>
                  )}

                  {record.cgpa !== null && (
                    <div>
                      <dt>CGPA (Optional)</dt>
                      <dd>{record.cgpa}</dd>
                    </div>
                  )}
                </dl>

                <div className="record-actions">
                  <button
                    type="button"
                    className="icon-button small"
                    onClick={() =>
                      setModal({ type: "education", record })
                    }
                    aria-label="Edit education"
                  >
                    <FiEdit2 />
                  </button>

                  <button
                    type="button"
                    className="icon-button small danger"
                    onClick={() =>
                      removeRecord("education", record.id)
                    }
                    aria-label="Delete education"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard
          icon={FiBriefcase}
          title="Work Experience"
          subtitle="Your professional experience."
          onEdit={
            experience.length
              ? () => setModal({ type: "experience" })
              : null
          }
          editLabel="Add"
        >
          {experience.length === 0 ? (
            <EmptyBlock
              icon={FiBriefcase}
              text="No work experience added yet."
              action="Add Experience"
              onClick={() => setModal({ type: "experience" })}
            />
          ) : (
            experience.map((record) => (
              <div className="record" key={record.id}>
                <div>
                  <strong>{record.job_title}</strong> · {record.company}

                  {(record.start_date || record.end_date) && (
                    <p className="muted small">
                      {record.start_date || "Start not set"} –{" "}
                      {record.end_date || "Present"}
                    </p>
                  )}

                  {record.description && (
                    <p className="small">{record.description}</p>
                  )}
                </div>

                <div className="record-actions">
                  <button
                    type="button"
                    className="icon-button small"
                    onClick={() =>
                      setModal({ type: "experience", record })
                    }
                    aria-label="Edit experience"
                  >
                    <FiEdit2 />
                  </button>

                  <button
                    type="button"
                    className="icon-button small danger"
                    onClick={() =>
                      removeRecord("experience", record.id)
                    }
                    aria-label="Delete experience"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard
          icon={FiBarChart2}
          title="Skills"
          subtitle="Your skills help us find better job matches."
          onEdit={
            skills.length
              ? () => setModal({ type: "skills" })
              : null
          }
        >
          {skills.length === 0 ? (
            <EmptyBlock
              icon={FiBarChart2}
              text="No skills added yet."
              action="Add Skills"
              onClick={() => setModal({ type: "skills" })}
            />
          ) : (
            <SkillChips skills={skills} variant="soft" />
          )}

          {resume && (
            <p className="muted small resume-note">
              Skills from your resume ({resume.filename}) are also used
              for matching.{" "}
              <Link to="/upload">Update resume</Link>
            </p>
          )}
        </SectionCard>
      </div>

      {modal?.type === "education" && (
        <EducationModal
          record={modal.record}
          onClose={() => setModal(null)}
          onSaved={(updated) =>
            applyProfile(updated, "Education saved.")
          }
        />
      )}

      {modal?.type === "experience" && (
        <ExperienceModal
          record={modal.record}
          onClose={() => setModal(null)}
          onSaved={(updated) =>
            applyProfile(updated, "Experience saved.")
          }
        />
      )}

      {modal?.type === "skills" && (
        <SkillsModal
          skills={skills}
          suggestions={resume?.skills || []}
          onClose={() => setModal(null)}
          onSaved={(updated) =>
            applyProfile(
              updated,
              "Skills saved. Your recommendations will update."
            )
          }
        />
      )}
    </div>
  );
}
