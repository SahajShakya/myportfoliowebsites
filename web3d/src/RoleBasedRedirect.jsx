import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";



const RoleBasedRedirect = ({
  role,
  routeName,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRole = storedUser ? JSON.parse(storedUser).role : null;

    if (!storedRole) {
      navigate("/login");
    } else {
      // Navigate based on the role
      if (storedRole === "admin") {
        const adminRoute = routeName
          ? `/admin/${routeName}`
          : "/admin/dashboard";
        navigate(adminRoute);
      } else if (storedRole === "patient") {
        navigate("/");
      } else if (storedRole === "doctor") {
        navigate(`/doctor/${routeName}`);
      } else if (storedRole === "employee") {
        navigate(`/employee/${routeName}`);
      } else {
        navigate("/access-denied");
      }
    }
  }, [role, routeName, navigate]);

  return null; // No UI is rendered, only a redirect
};

export default RoleBasedRedirect;
