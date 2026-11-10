import { useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Protected } from "./components/Layout.jsx";
import { homePathFor, useAuth } from "./context/AuthContext.jsx";
import { Loading } from "./components/ui.jsx";

import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import InfoPage from "./pages/InfoPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";

import DashboardPage from "./pages/candidate/DashboardPage.jsx";
import UploadResumePage from "./pages/candidate/UploadResumePage.jsx";
import ProfilePage from "./pages/candidate/ProfilePage.jsx";
import RecommendedJobsPage from "./pages/candidate/RecommendedJobsPage.jsx";
import JobDetailsPage from "./pages/candidate/JobDetailsPage.jsx";
import ApplyPage from "./pages/candidate/ApplyPage.jsx";
import SavedJobsPage from "./pages/candidate/SavedJobsPage.jsx";
import ApplicationHistoryPage from "./pages/candidate/ApplicationHistoryPage.jsx";
import CategoriesPage from "./pages/candidate/CategoriesPage.jsx";
import CategoryJobsPage from "./pages/candidate/CategoryJobsPage.jsx";

import RecruiterDashboardPage from "./pages/recruiter/RecruiterDashboardPage.jsx";
import JobFormPage from "./pages/recruiter/JobFormPage.jsx";
import ScreeningPage from "./pages/recruiter/ScreeningPage.jsx";
import ApplicantsPage from "./pages/recruiter/ApplicantsPage.jsx";

// Login and sign-up pages send already logged-in users to their dashboard.
// Only users who were logged in when they opened the page are redirected here;
// after a fresh login or sign-up the page itself decides where to go next.
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  const wasLoggedIn = useRef(null);

  if (loading) return <Loading />;
  if (wasLoggedIn.current === null) wasLoggedIn.current = Boolean(user);

  return wasLoggedIn.current && user ? <Navigate to={homePathFor(user)} replace /> : children;
}

const candidate = (page) => <Protected role="candidate">{page}</Protected>;
const recruiter = (page) => <Protected role="recruiter">{page}</Protected>;
const anyUser = (page) => <Protected>{page}</Protected>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
      <Route path="/privacy" element={<InfoPage page="privacy" />} />
      <Route path="/terms" element={<InfoPage page="terms" />} />
      <Route path="/contact" element={<InfoPage page="contact" />} />

      <Route path="/dashboard" element={candidate(<DashboardPage />)} />
      <Route path="/upload" element={candidate(<UploadResumePage />)} />
      <Route path="/profile" element={candidate(<ProfilePage />)} />
      <Route path="/recommendations" element={candidate(<RecommendedJobsPage />)} />
      <Route path="/jobs/:jobId" element={candidate(<JobDetailsPage />)} />
      <Route path="/jobs/:jobId/apply" element={candidate(<ApplyPage />)} />
      <Route path="/saved" element={candidate(<SavedJobsPage />)} />
      <Route path="/applications" element={candidate(<ApplicationHistoryPage />)} />
      <Route path="/categories" element={candidate(<CategoriesPage />)} />
      <Route path="/categories/:slug" element={candidate(<CategoryJobsPage />)} />

      <Route path="/recruiter" element={recruiter(<RecruiterDashboardPage />)} />
      <Route path="/recruiter/jobs/new" element={recruiter(<JobFormPage />)} />
      <Route path="/recruiter/jobs/:jobId/edit" element={recruiter(<JobFormPage />)} />
      <Route path="/recruiter/screening" element={recruiter(<ScreeningPage />)} />
      <Route path="/recruiter/applicants" element={recruiter(<ApplicantsPage />)} />

      <Route path="/settings" element={anyUser(<SettingsPage />)} />
      <Route path="/help" element={anyUser(<HelpPage />)} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
