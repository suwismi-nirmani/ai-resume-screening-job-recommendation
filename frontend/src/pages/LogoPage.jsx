import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import { PiQuotesFill } from "react-icons/pi";

import authImage from "../assets/auth-login.jpg";
import { Logo, SiteFooter } from "../components/Layout.jsx";
import { Alert, Field, IconInput, PasswordInput } from "../components/ui.jsx";
import { homePathFor, useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      const from = location.state?.from;
      navigate(from && from !== "/login" ? from : homePathFor(user), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role) => {
    setEmail(`${role}@careermatch.demo`);
    setPassword("Demo@123");
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-side">
          <Logo />
          <h1>
            Your Career <span>Starts Here</span>
          </h1>
          <p>Upload your resume, discover opportunities, and take the next step towards your future.</p>
          <div className="auth-image-wrap">
            <img src={authImage} alt="" />
            <div className="auth-quote">
              <PiQuotesFill aria-hidden="true" />
              <p>A small step today can lead to a brighter tomorrow.</p>
            </div>
          </div>
        </section>

        <section className="auth-card-wrap">
          <form className="auth-card" onSubmit={handleSubmit} noValidate>
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Login to your CareerMatch AI account</p>

            <Alert>{error}</Alert>
            <Alert type="info" onClose={() => setInfo("")}>{info}</Alert>

            <Field label="Email Address">
              {(id) => (
                <IconInput id={id} icon={FiMail} type="email" autoComplete="email"
                  placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              )}
            </Field>

            <Field label="Password">
              {(id) => (
                <PasswordInput id={id} icon={FiLock} autoComplete="current-password"
                  placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
              )}
            </Field>

            <div className="auth-row-end">
              <button type="button" className="link-button"
                onClick={() => setInfo("Password reset by email is not available yet. Please contact support through Help & Support or ask your administrator.")}>
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-large" disabled={submitting}>
              {submitting ? "Logging in..." : <>Login <FiArrowRight aria-hidden="true" /></>}
            </button>

            <div className="demo-box">
              <p>Demo accounts for testing (password <code>Demo@123</code>):</p>
              <div>
                <button type="button" className="btn btn-soft btn-small" onClick={() => fillDemo("candidate")}>Candidate demo</button>
                <button type="button" className="btn btn-soft btn-small" onClick={() => fillDemo("recruiter")}>Recruiter demo</button>
              </div>
            </div>

            <hr />
            <p className="auth-switch">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </form>
        </section>
      </div>
      <SiteFooter simple />
    </div>
  );
}
