import { useEffect, useRef, useState } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiBell,
  FiBookmark,
  FiChevronDown,
  FiClipboard,
  FiFileText,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPlusCircle,
  FiSearch,
  FiSettings,
  FiTarget,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { PiQuotesFill } from "react-icons/pi";

import { api } from "../api.js";
import { homePathFor, useAuth } from "../context/AuthContext.jsx";
import { initials, STATUS_LABELS, timeAgo } from "../utils/format.js";
import { Loading } from "./ui.jsx";

export function Logo({ to = "/", compact = false }) {
  return (
    <Link to={to} className="logo" aria-label="CareerMatch AI home">
      <svg className="logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="3" y="9" width="26" height="18" rx="3.5" stroke="currentColor" strokeWidth="2.4" />
        <path d="M11 9V6.5A2.5 2.5 0 0 1 13.5 4h5A2.5 2.5 0 0 1 21 6.5V9M3 16h26" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <rect x="13" y="13.5" width="6" height="5" rx="1.2" fill="#fff" stroke="currentColor" strokeWidth="2.2" />
      </svg>
      <span className="logo-text">
        <strong>CareerMatch AI</strong>
        {!compact && <span>Find your right job, Build your future</span>}
      </span>
    </Link>
  );
}

export function SiteFooter({ simple = false }) {
  return (
    <footer className={`site-footer ${simple ? "simple" : ""}`}>
      {!simple && (
        <div>
          <strong>CareerMatch AI</strong>
          <p>Find your right job, Build your future</p>
        </div>
      )}
      {simple && <p>© 2026 CareerMatch AI. All rights reserved.</p>}
      <div className="footer-right">
        <nav aria-label="Footer">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Use</Link>
          <Link to="/contact">Contact Us</Link>
        </nav>
        {!simple && <p>© 2026 CareerMatch AI. All rights reserved.</p>}
      </div>
    </footer>
  );
}

const CANDIDATE_NAV = [
  { to: "/dashboard", label: "Home", icon: FiHome },
  { to: "/upload", label: "Upload Resume", icon: FiFileText },
  { to: "/profile", label: "My Profile", icon: FiUser },
  { to: "/recommendations", label: "Recommended Jobs", icon: FiSearch },
  { to: "/saved", label: "Saved Jobs", icon: FiBookmark },
  { to: "/applications", label: "Application History", icon: FiClipboard },
  { to: "/categories", label: "Popular Job Categories", icon: FiGrid },
];

const RECRUITER_NAV = [
  { to: "/recruiter", label: "Dashboard", icon: FiHome, end: true },
  { to: "/recruiter/jobs/new", label: "Post a Job", icon: FiPlusCircle },
  { to: "/recruiter/screening", label: "Resume Screening", icon: FiTarget },
  { to: "/recruiter/applicants", label: "Applicants", icon: FiUsers },
];

const SHARED_NAV = [
  { to: "/settings", label: "Settings", icon: FiSettings },
  { to: "/help", label: "Help & Support", icon: FiHelpCircle },
];

// The designs show a different encouraging quote on each page.
const QUOTES = [
  ["/upload", "Small steps today, big opportunities tomorrow."],
  ["/profile", "Small steps today, big opportunities tomorrow."],
  ["/recommendations", "Your skills can take you places."],
  ["/jobs", "Take the next step towards your dream career."],
  ["/saved", "Good opportunities are worth keeping."],
  ["/applications", "Your career journey matters. Keep going!"],
  ["/categories", "Your next opportunity is closer than you think."],
  ["/settings", "Small steps lead to big opportunities."],
  ["/help", "We're here to support your career journey."],
  ["/recruiter", "Great teams start with the right match."],
];

function quoteFor(pathname) {
  const match = QUOTES.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : "Opportunities don't happen, you create them.";
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (event) => ref.current && !ref.current.contains(event.target) && onOutside();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

function Notifications({ user }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    const load = user.role === "candidate" ? api.getApplications() : api.recruiterApplications();
    load
      .then((rows) => {
        const relevant =
          user.role === "candidate"
            ? rows.filter((row) => row.status !== "under_review").map((row) => ({
                id: row.id,
                text: `${row.title}: ${STATUS_LABELS[row.status]}`,
                when: row.updated_at,
                to: "/applications",
              }))
            : rows.filter((row) => row.status === "under_review").map((row) => ({
                id: row.id,
                text: `${row.full_name} applied for ${row.job_title}`,
                when: row.created_at,
                to: "/recruiter/applicants",
              }));
        setItems(relevant.slice(0, 6));
      })
      .catch(() => setItems([]));
  }, [user.role]);

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="bell-button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <FiBell />
        {items?.length > 0 && <span className="bell-dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="dropdown-menu notifications">
          <p className="dropdown-title">Notifications</p>
          {items === null && <p className="muted small">Loading...</p>}
          {items?.length === 0 && <p className="muted small">You're all caught up.</p>}
          {items?.map((item) => (
            <Link key={item.id} to={item.to} className="notification" onClick={() => setOpen(false)}>
              <span>{item.text}</span>
              <span className="muted small">{timeAgo(item.when)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="user-button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="avatar">{initials(user.full_name)}</span>
        <span className="user-text">
          <strong>{user.full_name.split(" ")[0]}</strong>
          <span>{user.role === "recruiter" ? "Recruiter" : "Candidate"}</span>
        </span>
        <FiChevronDown aria-hidden="true" />
      </button>
      {open && (
        <div className="dropdown-menu">
          {user.role === "candidate" && (
            <Link to="/profile" onClick={() => setOpen(false)}>
              <FiUser /> My Profile
            </Link>
          )}
          <Link to="/settings" onClick={() => setOpen(false)}>
            <FiSettings /> Settings
          </Link>
          <button type="button" onClick={handleLogout}>
            <FiLogOut /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppLayout({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const nav = user.role === "recruiter" ? RECRUITER_NAV : CANDIDATE_NAV;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="icon-button menu-button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
        <Logo to={homePathFor(user)} />
        <div className="topbar-right">
          <Notifications user={user} />
          <span className="topbar-divider" aria-hidden="true" />
          <UserMenu user={user} />
        </div>
      </header>

      <div className="app-body">
        <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
          <nav aria-label="Main">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
                <item.icon aria-hidden="true" /> {item.label}
              </NavLink>
            ))}
            <hr />
            {SHARED_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="nav-link">
                <item.icon aria-hidden="true" /> {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="quote-card">
            <PiQuotesFill className="quote-mark" aria-hidden="true" />
            <p>{quoteFor(pathname)}</p>
            <span className="quote-rule" aria-hidden="true" />
            <svg className="quote-hills" viewBox="0 0 200 70" aria-hidden="true">
              <path d="M0 70 L40 40 L62 52 L110 14 L150 46 L170 34 L200 58 L200 70 Z" />
            </svg>
          </div>
        </aside>
        {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
        <main className="app-main">{children}</main>
      </div>

      <SiteFooter />
    </div>
  );
}

// Wraps a page that needs login (and optionally a specific role).
export function Protected({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading text="Loading your account..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />;

  return <AppLayout>{children}</AppLayout>;
}