import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "./context/AuthContext";

const AuthRedirectWrapper = ({ children }) => {
  const { user, isAuthenticated } = useAuthContext();

  if (isAuthenticated && user?.role) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/"} />;
  }

  return <>{children}</>;
};

export default AuthRedirectWrapper;
