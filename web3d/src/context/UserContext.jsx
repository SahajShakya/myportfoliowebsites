import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useAuth } from "../Hooks/Auth/useAuth"; // Import the custom useAuth hook
import { getAuth } from "firebase/auth";


// Create the context with a default value (set to null for now)
const UserContext = createContext(undefined);

// Custom hook to access the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};



export const UserProvider = ({ children }) => {
  // Initialize the user state with empty values
  const [user, setUser] = useState({
    name: "",
    email: "",
    roleId: "",
    role: "",
  });

  // Call useAuth hook inside the component (this is the correct way)
  const { logout } = useAuth();

  // Load user data from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Parse and set user data if it exists in localStorage
    }
  }, []);

  // Function to fully update user data (replace the existing state)
  const addData = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData)); // Save user data to localStorage
  };

  // Define the handleLogout function
  const handleLogout = () => {
    const auth = getAuth();
    console.log(auth.currentUser?.uid);

    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("refreshToken");
    addData({
      name: "",
      email: "",
      roleId: "",
      role: "",
    });
    localStorage.removeItem("user");
    console.log("Logout called inside Context");

    if (auth.currentUser) {
      console.log("Logout called inside Context if block");
      logout(auth.currentUser.uid); // Call the logout from useAuth here
    }
  };

  return (
    <UserContext.Provider value={{ user, addData, handleLogout }}>
      {children}
    </UserContext.Provider>
  );
};
