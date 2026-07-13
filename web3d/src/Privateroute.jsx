import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "./context/AuthContext";

const PrivateRoute = ({ element, roleProps }) => {
  const { user, isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roleProps && user?.role !== roleProps) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{element}</>;
};

export default PrivateRoute;
