import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useAuth } from "../Hooks/Auth/useAuth"; // Import the custom useAuth hook
import { getAuth } from "firebase/auth";

// Define types for the user state
interface User {
  name: string;
  email: string;
  roleId: string;
  role: string;
}

// Define the shape of the context
interface UserContextType {
  user: User;
  addData: (userData: User) => void;
  handleLogout: () => void;
}

// Create the context with a default value (set to null for now)
const UserContext = createContext<UserContextType | undefined>(undefined);

// Custom hook to access the user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Define the provider component
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Initialize the user state with empty values
  const [user, setUser] = useState<User>({
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
  const addData = (userData: User) => {
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
