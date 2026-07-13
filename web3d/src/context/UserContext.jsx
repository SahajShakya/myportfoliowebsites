import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuthContext } from "./AuthContext";

const UserContext = createContext(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    roleId: "",
    role: "",
  });

  const { logout: authLogout, user: authUser } = useAuthContext();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      setUser((prev) => ({ ...prev, ...authUser }));
    }
  }, [authUser]);

  const addData = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await authLogout();
    addData({
      name: "",
      email: "",
      roleId: "",
      role: "",
    });
    localStorage.removeItem("user");
  };

  return (
    <UserContext.Provider value={{ user, addData, handleLogout }}>
      {children}
    </UserContext.Provider>
  );
};
