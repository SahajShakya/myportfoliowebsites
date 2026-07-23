import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "./context/AuthContext";

const RoleBasedRedirect = ({ role, routeName }) => {
  const { user, loading } = useAuthContext();
  const storedRole = user?.role;

  if (loading) {
    return null;
  }

  if (!storedRole) {
    return <Navigate to="/vitra" />;
  }

  if (storedRole === "admin") {
    return <Navigate to={routeName ? `/admin/${routeName}` : "/admin/dashboard"} />;
  }

  if (storedRole === "patient" || storedRole === "employee" || storedRole === "doctor") {
    return <Navigate to="/" />;
  }

  return <Navigate to="/unauthorized" />;
};

export default RoleBasedRedirect;
