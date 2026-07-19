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
  const [user, setUser] = useState({});
  const { user: authUser } = useAuthContext();

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else {
      setUser({});
    }
  }, [authUser]);

  const addData = (userData) => {
    setUser(userData);
  };

  return (
    <UserContext.Provider value={{ user, addData }}>
      {children}
    </UserContext.Provider>
  );
};
