import { useMemo, useState } from "react";
import { FiBookOpen, FiChevronDown, FiChevronRight, FiMail, FiSearch } from "react-icons/fi";

import { api } from "../api.js";
import { Alert, Field, Modal, PageHeader } from "../components/ui.jsx";

const FAQS = [
  ["How do I create an account?", "Click Get Started on the home page, fill in your name, email and password, choose Candidate or Recruiter, and agree to the terms."],
  ["How do I upload or update my resume?", "Open Upload Resume and drag in a PDF or TXT file (up to 5 MB). Uploading a new file replaces the old one for matching."],
  ["How is my match score calculated?", "Final score = 60% text similarity (TF-IDF and cosine similarity between your resume and the job description) + 40% skill match (the share of the job's required skills you have)."],
  ["How do I apply for a job?", "Open a job from Recommended Jobs, click Apply Now, check your details, optionally add a cover letter, and click Submit Application."],
  ["Can I edit or delete my application?", "You can withdraw an application from Application History while it is still Under Review. To change it, withdraw and apply again."],
  ["Why is my application under review?", "The recruiter has not made a decision yet. The status changes to Shortlisted or Rejected once they review it."],
  ["How will I know if my application is rejected?", "The status in Application History changes to Rejected, and you will see a notification under the bell icon."],
  ["How do I update my profile information?", "Go to My Profile and use the Edit buttons on each section. Skills you add there are used in matching too."],
  ["Is my personal information safe?", "Passwords are hashed, uploaded files are not stored (only extracted text), and recruiters only see your resume if you apply or make your profile visible. You can delete your account in Settings."],
];

const RESOURCES = {
  guide: {
    title: "User Guide",
    subtitle: "Learn how to use CareerMatch AI",
    body: [
      "1. Upload your resume from Upload Resume. We extract the text and detect your skills.",
      "2. Open Recommended Jobs to see every active job ranked by your final match score.",
      "3. Open a job to see the score breakdown, matched skills, missing skills and the reasons.",
      "4. Save interesting jobs with the bookmark icon, or apply directly.",
      "5. Follow your applications in Application History.",
    ],
  },
  tips: {
    title: "Tips for a Better Profile",
    subtitle: "Improve your chances of getting noticed",
    body: [
      "Use a text-based PDF, not a scanned image, so the text can be read.",
      "List your technical skills clearly, using common names (for example \"React\", \"SQL\").",
      "Describe projects and experience with the tools you used.",
      "Add any missing skills on My Profile, since they count towards the skill match.",
    ],
  },
  guidelines: {
    title: "Community Guidelines",
    subtitle: "Our platform policies and standards",
    body: [
      "Provide accurate information about yourself and your jobs.",
      "Treat candidates and recruiters with respect.",
      "Do not upload documents that contain other people's personal data.",
      "Match scores support human decisions. Recruiters stay responsible for hiring decisions.",
    ],
  },
};

function ContactModal({ onClose }) {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [status, setStatus] = useState({});
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.contactSupport(form);
      setStatus({ success: response.message });
      setForm({ subject: "", message: "" });
    } catch (err) {
      setStatus({ error: err.message });
    }
  };

  return (
    <Modal title="Contact Support" onClose={onClose}>
      <form onSubmit={submit}>
        <Alert>{status.error}</Alert>
        <Alert type="success">{status.success}</Alert>
        <Field label="Subject">{(id) => <input id={id} value={form.subject} onChange={update("subject")} minLength={3} required />}</Field>
        <Field label="Message" hint="At least 10 characters.">
          {(id) => <textarea id={id} rows={5} value={form.message} onChange={update("message")} minLength={10} maxLength={2000} required />}
        </Field>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
          <button type="submit" className="btn btn-primary">Send Message</button>
        </div>
      </form>
    </Modal>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [resource, setResource] = useState(null);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text ? FAQS.filter(([q, a]) => `${q} ${a}`.toLowerCase().includes(text)) : FAQS;
  }, [query]);

  const visible = showAll || query ? filtered : filtered.slice(0, 8);

  return (
    <div className="page">
      <PageHeader crumbs={[{ label: "Help & Support" }]} title="Help & Support"
        subtitle="Find answers, get support, and reach out to us anytime." />

      <div className="help-layout">
        <div>
          <div className="help-search">
            <div className="search-input large">
              <FiSearch aria-hidden="true" />
              <input type="search" placeholder="Search for help articles..." value={query}
                onChange={(event) => setQuery(event.target.value)} aria-label="Search help articles" />
            </div>
          </div>

          <div className="card-heading plain">
            <h2>Frequently Asked Questions</h2>
            {!query && FAQS.length > 8 && (
              <button type="button" className="text-link" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Show less" : "View all"}
              </button>
            )}
          </div>

          {visible.length === 0 && <p className="muted">No articles match "{query}".</p>}
          <div className="faq-list">
            {visible.map(([question, answer]) => {
              const index = FAQS.findIndex(([q]) => q === question);
              const open = openIndex === index;
              return (
                <div className={`faq ${open ? "open" : ""}`} key={question}>
                  <button type="button" onClick={() => setOpenIndex(open ? null : index)} aria-expanded={open}>
                    {question}
                    <FiChevronDown aria-hidden="true" />
                  </button>
                  {open && <p>{answer}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="help-side">
          <section className="card">
            <div className="help-contact">
              <span className="round-icon tone-blue large"><FiMail aria-hidden="true" /></span>
              <div>
                <h2>Still need help?</h2>
                <p className="muted">Can't find what you're looking for? Get in touch with our support team.</p>
              </div>
            </div>
            <button type="button" className="btn btn-primary btn-block btn-large" onClick={() => setContactOpen(true)}>
              Contact Support
            </button>
            <p className="muted small center">We usually respond within 1-2 business days.</p>
          </section>

          <section className="card">
            <div className="help-contact">
              <span className="round-icon tone-blue large"><FiBookOpen aria-hidden="true" /></span>
              <h2>Other Resources</h2>
            </div>
            <div className="resource-list">
              {Object.entries(RESOURCES).map(([key, item]) => (
                <button type="button" key={key} className="resource" onClick={() => setResource(item)}>
                  <span>
                    <strong>{item.title}</strong>
                    <span className="muted">{item.subtitle}</span>
                  </span>
                  <FiChevronRight aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}
      {resource && (
        <Modal title={resource.title} onClose={() => setResource(null)}>
          <ul className="bullet-list">
            {resource.body.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </Modal>
      )}
    </div>
  );
}