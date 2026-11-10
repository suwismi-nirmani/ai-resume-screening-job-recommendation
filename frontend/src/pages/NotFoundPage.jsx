import { Link } from "react-router-dom";

import { Logo } from "../components/Layout.jsx";

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <Logo />
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}