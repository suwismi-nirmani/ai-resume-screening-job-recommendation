import { Link } from "react-router-dom";

import { Logo, SiteFooter } from "../components/Layout.jsx";

const PAGES = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      ["What we collect", "Your name, email, optional phone number and location, the text extracted from resumes you upload, and the skills, education and experience you add to your profile."],
      ["How we use it", "Resume text and skills are used only to calculate job match scores and explain recommendations. We do not sell or share your data."],
      ["Who can see it", "Recruiters can screen your latest resume only if you apply for their job or keep \"Make my profile visible to recruiters\" turned on in Settings."],
      ["Files", "Uploaded files are not stored. Only the extracted text is saved in the system database."],
      ["Deleting your data", "You can permanently delete your account and all related data from Settings at any time."],
      ["Academic project", "CareerMatch AI is a university final year project (Group 06). Please do not upload real confidential documents during testing."],
    ],
  },
  terms: {
    title: "Terms of Use",
    sections: [
      ["Purpose", "CareerMatch AI gives job recommendations to support, not replace, human decisions. A high match score does not guarantee that a candidate is suitable for a position."],
      ["Your account", "Keep your password private. You are responsible for the accuracy of the information you provide."],
      ["Fair use", "Do not upload content you do not have the right to share, and do not try to access other users' data."],
      ["No automated decisions", "The system never rejects candidates automatically. Recruiters make all hiring decisions."],
    ],
  },
  contact: {
    title: "Contact Us",
    sections: [
      ["Support", "Logged-in users can message the support team from Help & Support. We usually respond within 1-2 business days."],
      ["Project team", "Group 06: Project Lead and Backend, Frontend, AI and NLP, and Quality Assurance members."],
    ],
  },
};

export default function InfoPage({ page }) {
  const content = PAGES[page];
  return (
    <div className="info-page">
      <header className="landing-header">
        <Logo />
        <Link to="/" className="btn btn-outline">Back to Home</Link>
      </header>
      <main className="info-content">
        <h1>{content.title}</h1>
        {content.sections.map(([heading, text]) => (
          <section key={heading}>
            <h2>{heading}</h2>
            <p>{text}</p>
          </section>
        ))}
        {page === "contact" && (
          <Link to="/help" className="btn btn-primary">Go to Help & Support</Link>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
