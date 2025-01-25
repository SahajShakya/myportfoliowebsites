import React from "react";
import { Navigate } from "react-router-dom";
// import { useUser } from "./context/UserContext";
import { useActiveUser } from "./Components/Query/getActiveUsers";
import { getAuth } from "firebase/auth";

interface PrivateRouteProps {
  element: React.ReactNode;
  roleProps: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, roleProps }) => {
  // const { user } = useUser(); // Access user info from context
  const auth = getAuth();
  const uid = auth.currentUser?.uid; // Get the user ID from Firebase Auth
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading, isError, error } = useActiveUser(uid) as any;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  const token = localStorage.getItem("authToken");
  const tokenExpiry = localStorage.getItem("tokenExpiry");
  const currentTime = new Date().getTime();

  const dataToken = data?.token;
  const dataRole = data?.role;

  // Check if the token exists and is not expired
  if (!token || !tokenExpiry || currentTime > parseInt(tokenExpiry)) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("user");
    return <Navigate to="/login" />;
  }

  // Check if the user is logged in and has the correct role
  if (!token) {
    return <Navigate to="/login" />;
  }

  if (dataToken !== token) {
    return <Navigate to="/unauthorized" />;
  }

  if (dataRole !== roleProps) {
    return <Navigate to="/unauthorized" />;
  }

  // If user is logged in and has correct role, render the element (component)
  return <>{element}</>;
};

export default PrivateRoute;
