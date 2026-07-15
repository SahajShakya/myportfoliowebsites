import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

const useAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user || !user.id) {
      navigate("/vitra");
      return;
    }

    const fetchUserRole = async () => {
      try {
        const data = await api.get(`/auth/user/${user.id}`);
        if (data.user) {
          const role = data.user.role_name;
          if (role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Error fetching user role: ", error);
        navigate("/vitra");
      }
    };

    fetchUserRole();
  }, [navigate]);
};

export default useAuthRedirect;
