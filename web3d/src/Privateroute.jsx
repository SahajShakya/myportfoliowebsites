import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "./context/AuthContext";

const PrivateRoute = ({ element, roleProps }) => {
  const { user, isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/vitra" />;
  }

  if (roleProps && user?.role !== roleProps) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{element}</>;
};

export default PrivateRoute;
