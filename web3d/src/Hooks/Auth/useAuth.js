import { useState } from "react";
import api from "../../api/client";

export const getUserRoleFromApi = async (userId) => {
  try {
    const data = await api.get(`/auth/user/${userId}`);
    if (data.user) {
      return { role: data.user.role_name, roleId: data.user.role_id };
    }
    return { role: null, roleId: null };
  } catch (error) {
    console.error("Error fetching user role:", error);
    return { role: null, roleId: null };
  }
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const register = async (email, password, name, role = "user") => {
    try {
      const data = await api.post("/auth/register", {
        email,
        password,
        name,
        role,
      });
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      const data = await api.post("/auth/login", { email, password });
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getUserData = async (userId) => {
    try {
      const data = await api.get(`/auth/user/${userId}`);
      return data.user || null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    }
    localStorage.removeItem("user");
    setUser(null);
  }

  return {
    user,
    error,
    register,
    login,
    getUserData,
    logout,
  };
};
