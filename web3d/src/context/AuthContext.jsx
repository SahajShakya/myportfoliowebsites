/* eslint-disable react/prop-types */
/* eslint-disable no-empty */
import { createContext, useState, useContext, useCallback, useEffect } from "react";
import { privateAgent, publicAgent } from "../api/authRequest";
import { routesName } from "../constants/routesName";

const AuthContext = createContext(null);

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await privateAgent.get(
          routesName.AuthRoute({}).me
        );
        if (data.user) {
          setUser(data.user);
        }
      } catch {
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await publicAgent.post(
      routesName.AuthRoute({}).login,
      { email, password }
    );
    if (data.user) setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (email, password, name, role) => {
    const { data } = await publicAgent.post(
      routesName.AuthRoute({}).register,
      { email, password, name, role }
    );
    if (data.user) setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await privateAgent.post(routesName.AuthRoute({}).logout);
    } catch {}
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user?.id,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
