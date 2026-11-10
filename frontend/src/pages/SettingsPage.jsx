import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiShield, FiTrash2, FiUser } from "react-icons/fi";

import { api, setToken } from "../api.js";
import { Alert, Field, Loading, Modal, PageHeader, PasswordInput } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function CardHead({ icon: Icon, tone = "blue", title, subtitle }) {
  return (
    <div className="profile-card-head">
      <span className={`round-icon tone-${tone}`}><Icon aria-hidden="true" /></span>
      <div>
        <h2>{title}</h2>
        <p className="muted">{subtitle}</p>
      </div>
    </div>
  );
}

function AccountSettings({ profile, onSaved }) {
  const [form, setForm] = useState({
    full_name: profile.user.full_name, email: profile.user.email, phone: profile.user.phone,
  });
  const [status, setStatus] = useState({});
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus({});
    try {
      const updated = await api.updateProfile({
        ...form, location: profile.user.location, current_status: profile.user.current_status,
      });
      onSaved(updated);
      setStatus({ success: "Changes saved." });
    } catch (err) {
      setStatus({ error: err.message });
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <CardHead icon={FiUser} title="Account Settings" subtitle="Update your account information." />
      <Alert>{status.error}</Alert>
      <Alert type="success">{status.success}</Alert>
      <Field label="Full Name">{(id) => <input id={id} value={form.full_name} onChange={update("full_name")} required />}</Field>
      <Field label="Email Address">{(id) => <input id={id} type="email" value={form.email} onChange={update("email")} required />}</Field>
      <Field label="Phone Number">{(id) => <input id={id} type="tel" value={form.phone} onChange={update("phone")} placeholder="+94 77 123 4567" />}</Field>
      <div className="form-actions"><button type="submit" className="btn btn-primary">Save Changes</button></div>
    </form>
  );
}

function PasswordSettings() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [status, setStatus] = useState({});
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus({});
    if (form.next.length < 6) return setStatus({ error: "New password must be at least 6 characters long." });
    if (form.next !== form.confirm) return setStatus({ error: "New passwords do not match." });
    try {
      await api.changePassword({ current_password: form.current, new_password: form.next });
      setForm({ current: "", next: "", confirm: "" });
      setStatus({ success: "Password updated." });
    } catch (err) {
      setStatus({ error: err.message });
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <CardHead icon={FiLock} title="Password & Security" subtitle="Keep your account secure." />
      <Alert>{status.error}</Alert>
      <Alert type="success">{status.success}</Alert>
      <Field label="Current Password">{(id) => <PasswordInput id={id} value={form.current} onChange={update("current")} placeholder="Enter current password" autoComplete="current-password" />}</Field>
      <Field label="New Password">{(id) => <PasswordInput id={id} value={form.next} onChange={update("next")} placeholder="Enter new password" autoComplete="new-password" />}</Field>
      <Field label="Confirm New Password">{(id) => <PasswordInput id={id} value={form.confirm} onChange={update("confirm")} placeholder="Confirm new password" autoComplete="new-password" />}</Field>
      <div className="form-actions"><button type="submit" className="btn btn-primary">Update Password</button></div>
    </form>
  );
}

function DeleteAccountModal({ onClose }) {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const confirm = async (event) => {
    event.preventDefault();
    try {
      await api.deleteAccount(password);
      setToken(null);
      setUser(null);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title="Delete account" onClose={onClose}>
      <form onSubmit={confirm}>
        <p>This permanently deletes your account, resumes, saved jobs and applications. This cannot be undone.</p>
        <Alert>{error}</Alert>
        <Field label="Enter your password to confirm">
          {(id) => <PasswordInput id={id} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />}
        </Field>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-danger" disabled={!password}>Delete my account</button>
        </div>
      </form>
    </Modal>
  );
}

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.getProfile().then(setProfile).catch((err) => setError(err.message));
  }, []);

  const onSaved = (updated) => {
    setProfile(updated);
    setUser(updated.user);
  };

  const togglePrivacy = async () => {
    try {
      onSaved(await api.updatePrivacy(!profile.user.profile_visible));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <PageHeader crumbs={[{ label: "Settings" }]} title="Settings" subtitle="Manage your account and preferences." />
      <Alert>{error}</Alert>
      {!profile && !error && <Loading />}

      {profile && (
        <div className="settings-grid">
          <AccountSettings profile={profile} onSaved={onSaved} />

          {user.role === "candidate" ? (
            <section className="card">
              <CardHead icon={FiShield} title="Privacy Settings" subtitle="Control your profile visibility." />
              <label className="toggle-row">
                <span className="toggle">
                  <input type="checkbox" role="switch" checked={profile.user.profile_visible} onChange={togglePrivacy} />
                  <span className="toggle-track" aria-hidden="true" />
                </span>
                <span>
                  <strong>Make my profile visible to recruiters</strong>
                  <span className="muted">Allow recruiters to screen your latest resume for job opportunities.</span>
                </span>
              </label>
            </section>
          ) : (
            <section className="card">
              <CardHead icon={FiShield} title="Privacy" subtitle="How candidate data is handled." />
              <p className="muted">
                You can only screen resumes you uploaded, resumes attached to applications for your jobs, and
                resumes of candidates who chose to make their profile visible.
              </p>
            </section>
          )}

          <PasswordSettings />

          <section className="card delete-card">
            <span className="round-icon tone-red"><FiTrash2 aria-hidden="true" /></span>
            <div>
              <h2>Delete Account</h2>
              <p className="muted">Permanently delete your account and all data.</p>
            </div>
            <button type="button" className="btn btn-danger-outline" onClick={() => setDeleting(true)}>Delete Account</button>
          </section>
        </div>
      )}

      {deleting && <DeleteAccountModal onClose={() => setDeleting(false)} />}
    </div>
  );
}
