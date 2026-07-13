import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { routes } from "../constants/routes";

const AuthContext = createContext(null);

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => {
    return sessionStorage.getItem("accessToken");
  });
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const saveTokens = useCallback((access, refresh, userData) => {
    setAccessToken(access);
    sessionStorage.setItem("accessToken", access);
    if (refresh) sessionStorage.setItem("refreshToken", refresh);
    if (userData) {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    }
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const storedRefresh = sessionStorage.getItem("refreshToken");
    if (!storedRefresh) {
      clearAuth();
      return null;
    }
    try {
      const res = await fetch(routes.auth.refresh, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        clearAuth();
        return null;
      }
      const data = await res.json();
      if (data.accessToken) {
        saveTokens(data.accessToken, data.refreshToken, data.user);
        return data.accessToken;
      }
      clearAuth();
      return null;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth, saveTokens]);

  const login = useCallback(
    async (email, password) => {
      const res = await fetch(routes.auth.login, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      saveTokens(data.accessToken, data.refreshToken, data.user);
      return data;
    },
    [saveTokens]
  );

  const register = useCallback(
    async (email, password, name, role) => {
      const res = await fetch(routes.auth.register, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      saveTokens(data.accessToken, data.refreshToken, data.user);
      return data;
    },
    [saveTokens]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(routes.auth.logout, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {}
    clearAuth();
  }, [accessToken, clearAuth]);

  const value = {
    user,
    accessToken,
    isAuthenticated: !!user?.id,
    loading,
    login,
    register,
    logout,
    saveTokens,
    refreshAccessToken,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
