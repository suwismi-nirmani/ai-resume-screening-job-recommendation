// Small reusable building blocks: alerts, loaders, modals, form fields.

import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronRight,
  FiEye,
  FiEyeOff,
  FiInfo,
  FiX,
} from "react-icons/fi";

export function Alert({ type = "error", children, onClose }) {
  if (!children) return null;
  const Icon = type === "success" ? FiCheckCircle : type === "info" ? FiInfo : FiAlertCircle;
  return (
    <div className={`alert alert-${type}`} role={type === "error" ? "alert" : "status"}>
      <Icon aria-hidden="true" />
      <span>{children}</span>
      {onClose && (
        <button type="button" className="icon-button small" onClick={onClose} aria-label="Dismiss">
          <FiX />
        </button>
      )}
    </div>
  );
}

export function Loading({ text = "Loading..." }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {text}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-icon">
          <Icon aria-hidden="true" />
        </div>
      )}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, hint, error, children, optional }) {
  const id = useId();
  const child = typeof children === "function" ? children(id) : children;
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      {label && (
        <label htmlFor={id}>
          {label} {optional && <span className="optional">(Optional)</span>}
        </label>
      )}
      {child}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function PasswordInput({ id, icon: Icon, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-with-icon">
      {Icon && <Icon className="input-icon" aria-hidden="true" />}
      <input id={id} type={visible ? "text" : "password"} {...props} />
      <button
        type="button"
        className="input-action"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
}

export function IconInput({ id, icon: Icon, ...props }) {
  return (
    <div className="input-with-icon">
      <Icon className="input-icon" aria-hidden="true" />
      <input id={id} {...props} />
    </div>
  );
}

export function PageHeader({ crumbs = [], title, subtitle, children, back }) {
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        {crumbs.map((crumb) => (
          <span key={crumb.label} className="crumb">
            <FiChevronRight aria-hidden="true" />
            {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
          </span>
        ))}
      </nav>
      {back}
      {title && (
        <div className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {children && <div className="page-header-aside">{children}</div>}
        </div>
      )}
    </>
  );
}

export function StatusPill({ status }) {
  const labels = { under_review: "Under Review", shortlisted: "Shortlisted", rejected: "Rejected" };
  return <span className={`status-pill status-${status}`}>{labels[status] || status}</span>;
}