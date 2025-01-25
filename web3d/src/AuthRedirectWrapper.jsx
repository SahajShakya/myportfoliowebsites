import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthRedirectWrapper = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get token and role from localStorage
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("role");
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    const currentTime = new Date().getTime();

    // If token exists and is valid
    if (token && tokenExpiry && currentTime < parseInt(tokenExpiry)) {
      // Redirect based on role
      if (role === "admin" || role === "doctor") {
        console.log("Yay"); // Admin or Doctor roles
      } else if (role === "patient" || role === "employee") {
        console.log("Yarayar"); // Patient or Employee roles
      } else {
        navigate("/login");
      }
    }
  }, [navigate]);

  // If no valid token is found, render the children (Login or Register pages)
  return <>{children}</>;
};

export default AuthRedirectWrapper;
