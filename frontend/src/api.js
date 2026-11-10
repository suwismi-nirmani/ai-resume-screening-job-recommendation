// All calls to the FastAPI backend go through this file.

const BASE_URL = (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "careermatch_token";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be blocked (private mode). The session then lasts until reload.
  }
}

// Turn FastAPI error bodies into one readable sentence.
function errorMessage(body, status) {
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    // Pydantic errors: our own validators already read well ("Value error, ...");
    // built-in ones ("String should have at least 6 characters") need the field name.
    return detail
      .map((item) => {
        const message = String(item.msg || "");
        if (message.startsWith("Value error, ")) return message.slice(13);
        const field = String(item.loc?.[item.loc.length - 1] ?? "").replaceAll("_", " ");
        return field ? `${field[0].toUpperCase()}${field.slice(1)}: ${message}` : message;
      })
      .join(" ");
  }
  if (status >= 500) return "Something went wrong on the server. Please try again.";
  return "Request failed. Please try again.";
}

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running on port 8000?", 0);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw new ApiError(errorMessage(data, response.status), response.status);
  }

  return data;
}

export const api = {
  // Auth
  signup: (body) => request("/api/auth/signup", { method: "POST", body }),
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),

  // Profile and settings
  getProfile: () => request("/api/profile"),
  updateProfile: (body) => request("/api/profile", { method: "PUT", body }),
  addEducation: (body) => request("/api/profile/education", { method: "POST", body }),
  updateEducation: (id, body) => request(`/api/profile/education/${id}`, { method: "PUT", body }),
  deleteEducation: (id) => request(`/api/profile/education/${id}`, { method: "DELETE" }),
  addExperience: (body) => request("/api/profile/experience", { method: "POST", body }),
  updateExperience: (id, body) => request(`/api/profile/experience/${id}`, { method: "PUT", body }),
  deleteExperience: (id) => request(`/api/profile/experience/${id}`, { method: "DELETE" }),
  updateSkills: (skills) => request("/api/profile/skills", { method: "PUT", body: { skills } }),
  changePassword: (body) => request("/api/profile/password", { method: "PUT", body }),
  updatePrivacy: (profile_visible) =>
    request("/api/profile/privacy", { method: "PUT", body: { profile_visible } }),
  deleteAccount: (password) => request("/api/profile/delete", { method: "POST", body: { password } }),

  // Resumes
  uploadResume: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/api/resumes", { method: "POST", form });
  },
  latestResume: () => request("/api/resumes/latest"),

  // Jobs
  getJobs: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
    ).toString();
    return request(`/api/jobs${query ? `?${query}` : ""}`);
  },
  getCategories: () => request("/api/jobs/categories"),
  getJob: (id) => request(`/api/jobs/${id}`),

  // Candidate
  getRecommendations: (limit = 10) => request(`/api/recommendations?limit=${limit}`),
  getSavedJobs: () => request("/api/saved-jobs"),
  saveJob: (id) => request(`/api/saved-jobs/${id}`, { method: "POST" }),
  unsaveJob: (id) => request(`/api/saved-jobs/${id}`, { method: "DELETE" }),
  getApplications: () => request("/api/applications"),
  apply: (body) => request("/api/applications", { method: "POST", body }),
  withdrawApplication: (id) => request(`/api/applications/${id}`, { method: "DELETE" }),

  // Recruiter
  recruiterStats: () => request("/api/recruiter/stats"),
  recruiterJobs: () => request("/api/recruiter/jobs"),
  recruiterJob: (id) => request(`/api/recruiter/jobs/${id}`),
  createJob: (body) => request("/api/recruiter/jobs", { method: "POST", body }),
  updateJob: (id, body) => request(`/api/recruiter/jobs/${id}`, { method: "PUT", body }),
  setJobActive: (id, active) =>
    request(`/api/recruiter/jobs/${id}/status`, { method: "PATCH", body: { active } }),
  screenableResumes: () => request("/api/recruiter/resumes"),
  screen: (resume_id, job_id) =>
    request("/api/recruiter/screen", { method: "POST", body: { resume_id, job_id } }),
  screenings: () => request("/api/recruiter/screenings"),
  recruiterApplications: (jobId) =>
    request(`/api/recruiter/applications${jobId ? `?job_id=${jobId}` : ""}`),
  setApplicationStatus: (id, status) =>
    request(`/api/recruiter/applications/${id}`, { method: "PATCH", body: { status } }),

  // Support
  contactSupport: (body) => request("/api/support/messages", { method: "POST", body }),
};