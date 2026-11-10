import { Link } from "react-router-dom";
import { FiArrowRight, FiFileText, FiList, FiSearch, FiUpload, FiUsers } from "react-icons/fi";

import heroImage from "../assets/hero-home.jpg";
import { Logo, SiteFooter } from "../components/Layout.jsx";
import { homePathFor, useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  { icon: FiFileText, tone: "blue", title: "Resume Analysis", text: "Extract text and identify key skills from your resume." },
  { icon: FiSearch, tone: "green", title: "Intelligent Matching", text: "Match your skills with relevant job descriptions using AI." },
  { icon: FiList, tone: "purple", title: "Personalized Results", text: "Get a ranked list of jobs with match scores and explanations." },
  { icon: FiUsers, tone: "orange", title: "For Recruiters", text: "Easily manage job postings and screen resumes." },
];

const STEPS = [
  { title: "Upload your resume", text: "Upload a PDF or TXT resume. We extract the text and detect your skills." },
  { title: "We compare it with jobs", text: "TF-IDF and cosine similarity measure how closely your resume matches each job description." },
  { title: "Get ranked recommendations", text: "Final score = 60% text similarity + 40% skill match, with matched and missing skills explained." },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <header className="landing-header">
        <Logo />
        <nav className="landing-nav" aria-label="Main">
          <a href="#top" className="active">Home</a>
          <a href="#about">About</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#recruiters">For Recruiters</a>
        </nav>
        <div className="landing-actions">
          {user ? (
            <Link to={homePathFor(user)} className="btn btn-primary">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/signup" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero" id="top">
        <img className="hero-image" src={heroImage} alt="" />
        <div className="hero-content">
          <p className="eyebrow">Smart matching. Brighter opportunities.</p>
          <h1>
            Upload Your Resume
            <span>Find Jobs That Fit You</span>
          </h1>
          <p className="hero-text">
            Our AI analyzes your resume, extracts your skills, and recommends the most suitable jobs
            using intelligent matching. Find your right job, Build your future.
          </p>
          <div className="hero-buttons">
            <Link to={user ? "/upload" : "/signup"} className="btn btn-primary btn-hero">
              <FiUpload aria-hidden="true" />
              <span>
                <strong>Upload Your Resume</strong>
                <small>Get Job Recommendations</small>
              </span>
            </Link>
            <a href="#how-it-works" className="btn btn-outline btn-large">
              Learn More <FiArrowRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="features" id="about">
        {FEATURES.map((feature) => (
          <div className="feature" key={feature.title}>
            <div className={`feature-icon tone-${feature.tone}`}>
              <feature.icon aria-hidden="true" />
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </div>
        ))}
      </section>

      <section className="how-it-works" id="how-it-works">
        <h2>How It Works</h2>
        <p className="section-subtitle">Simple, transparent and explainable job matching.</p>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="recruiter-band" id="recruiters">
        <div>
          <h2>Hiring? Screen resumes in seconds.</h2>
          <p>
            Post jobs with the skills you need, then compare any resume against them to see the match
            score, matched skills and missing skills. Final decisions always stay with you.
          </p>
        </div>
        <Link to={user ? homePathFor(user) : "/signup"} className="btn btn-white">
          {user ? "Open Dashboard" : "Create a Recruiter Account"}
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
