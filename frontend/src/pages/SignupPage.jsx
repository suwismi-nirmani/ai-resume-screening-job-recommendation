import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBriefcase, FiLock, FiMail, FiTarget, FiTrendingUp, FiUser, FiUsers } from "react-icons/fi";

import authImage from "../assets/auth-signup.jpg";
import { Logo, SiteFooter } from "../components/Layout.jsx";
import { Alert, Field, IconInput, PasswordInput } from "../components/ui.jsx";
import { homePathFor, useAuth } from "../context/AuthContext.jsx";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validate(form) {
  const errors = {};
  if (form.full_name.trim().length < 2) errors.full_name = "Enter your full name.";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.password.length < 6) errors.password = "Password must be at least 6 characters long.";
  if (form.confirm !== form.password) errors.confirm = "Passwords do not match.";
  if (!form.agree_terms) errors.agree_terms = "Please agree to the Terms of Use and Privacy Policy.";
  return errors;
}

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm: "", role: "candidate", agree_terms: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      const { confirm, ...details } = form;
      const user = await signup({ ...details, full_name: details.full_name.trim(), email: details.email.trim() });
      navigate(user.role === "candidate" ? "/upload" : homePathFor(user), { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-side">
          <Logo />
          <h1>
            Start Your <span>Next Chapter</span>
          </h1>
          <p>Create your account, upload your resume and discover opportunities that match your skills.</p>
          <ul className="auth-benefits">
            <li><span className="benefit-icon tone-blue"><FiTarget /></span> Personalized job recommendations</li>
            <li><span className="benefit-icon tone-green"><FiTrendingUp /></span> Showcase your skills</li>
            <li><span className="benefit-icon tone-purple"><FiBriefcase /></span> Take the next step towards a brighter future</li>
          </ul>
          <div className="auth-image-wrap">
            <img src={authImage} alt="" />
          </div>
        </section>

        <section className="auth-card-wrap">
          <form className="auth-card" onSubmit={handleSubmit} noValidate>
            <h2>Create Your Account</h2>
            <p className="auth-subtitle">Join CareerMatch AI and take the next step in your career journey.</p>

            <Alert>{serverError}</Alert>

            <Field label="Full Name" error={errors.full_name}>
              {(id) => <IconInput id={id} icon={FiUser} autoComplete="name" placeholder="Enter your full name"
                value={form.full_name} onChange={update("full_name")} />}
            </Field>

            <Field label="Email Address" error={errors.email}>
              {(id) => <IconInput id={id} icon={FiMail} type="email" autoComplete="email" placeholder="you@example.com"
                value={form.email} onChange={update("email")} />}
            </Field>

            <Field label="Password" error={errors.password} hint="Password must be at least 6 characters long.">
              {(id) => <PasswordInput id={id} icon={FiLock} autoComplete="new-password" placeholder="Create a password"
                value={form.password} onChange={update("password")} />}
            </Field>

            <Field label="Confirm Password" error={errors.confirm}>
              {(id) => <PasswordInput id={id} icon={FiLock} autoComplete="new-password" placeholder="Confirm your password"
                value={form.confirm} onChange={update("confirm")} />}
            </Field>

            <fieldset className="field">
              <legend>Account Type</legend>
              <div className="role-options">
                {[
                  { value: "candidate", icon: FiUser, title: "Candidate", text: "Find jobs and upload your resume" },
                  { value: "recruiter", icon: FiUsers, title: "Recruiter", text: "Post jobs and screen resumes" },
                ].map((option) => (
                  <label key={option.value} className={`role-option ${form.role === option.value ? "selected" : ""}`}>
                    <input type="radio" name="role" value={option.value}
                      checked={form.role === option.value} onChange={update("role")} />
                    <option.icon className="role-icon" aria-hidden="true" />
                    <span>
                      <strong>{option.title}</strong>
                      <small>{option.text}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={`field ${errors.agree_terms ? "has-error" : ""}`}>
              <label className="checkbox">
                <input type="checkbox" checked={form.agree_terms} onChange={update("agree_terms")} />
                <span>
                  I agree to the <Link to="/terms" target="_blank">Terms of Use</Link> and{" "}
                  <Link to="/privacy" target="_blank">Privacy Policy</Link>
                </span>
              </label>
              {errors.agree_terms && <p className="field-error">{errors.agree_terms}</p>}
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-large" disabled={submitting}>
              {submitting ? "Creating account..." : "Create Account"}
            </button>

            <hr />
            <p className="auth-switch">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </section>
      </div>
      <SiteFooter simple />
    </div>
  );
}