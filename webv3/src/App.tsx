import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/NonAuth/Login/Login";
import LoadingScreen from "./Components/UI/Loading/LoadingScreen";
import DefaultLayout from "./Pages/Layout/DefaultLayout";
import Home from "./Pages/NonAuth/Home/Home";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { UserProvider, useUser } from "./context/UserContext";
import PrivateRoute from "./PrivateRoute";
import Unauthorized from "./Pages/Unauthorized ";
import AuthRedirectWrapper from "./AuthRedirectWrapper";
import Dashboard from "./Pages/Auth/Dashboard/Dashboard";
import AuthLayout from "./Pages/Layout/AuthLayout";

// Define fixed roles and their corresponding IDs
const roleData = [
  { id: 1, name: "admin" },
];

const checkAndCreateRoles = async () => {
  try {
    // Loop through each role and check if it exists in the collection
    for (const role of roleData) {
      const roleDocRef = doc(db, "roles", role.name); // Reference to role document
      const roleDoc = await getDoc(roleDocRef);

      // If the document doesn't exist, create it with the necessary fields
      if (!roleDoc.exists()) {
        await setDoc(roleDocRef, { id: role.id, name: role.name });
      }
    }
  } catch (error) {
    console.error("Error checking/creating roles:", error);
  }
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const { user } = useUser();


  useEffect(() => {
    const createRoles = async () => {
      await checkAndCreateRoles(); // Wait for roles to be created
      setIsLoading(false); // Set loading state to false once roles are created
    };
    createRoles();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<DefaultLayout />}>
            {/* <Route path="/" element={<Home />} /> */}
            <Route
              path="/"
              element={
                user.role ? (
                  // If user is logged in, navigate to their role-based dashboard
                  <PrivateRoute roleProps={user.role} element={<Home />} />
                ) : (
                  // Otherwise, show Home page
                  <Home />
                )
              }
            />
          </Route>

          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <AuthRedirectWrapper>
                <Login />
              </AuthRedirectWrapper>
            }
          />


          {/* Private Routes */}
          <Route path="/" element={<AuthLayout />}>
            {/* Admin Layout */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute
                  roleProps="admin"
                  element={<Dashboard role={"admin"} />}
                />
              }
            />
          </Route>

          {/* Unauthorized Route */}
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;
