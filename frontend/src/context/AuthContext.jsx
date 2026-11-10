import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, getToken, setToken } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // Restore the session on page load.
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // The API client fires this when the server rejects the token.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedIn } = await api.login({ email, password });
    setToken(token);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const signup = useCallback(async (details) => {
    const { token, user: created } = await api.signup(details);
    setToken(token);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Log out locally even if the server is unreachable.
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await api.me();
    setUser(fresh);
    return fresh;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser, setUser }),
    [user, loading, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function homePathFor(user) {
  return user?.role === "recruiter" ? "/recruiter" : "/dashboard";
}