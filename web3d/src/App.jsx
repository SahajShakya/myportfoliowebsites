import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./Pages/NonAuth/Login/Login";
import LoadingScreen from "./Components/UI/Loading/LoadingScreen";
import DefaultLayout from "./Pages/Layout/DefaultLayout";
import Home from "./Pages/NonAuth/Home/Home";
import { UserProvider } from "./context/UserContext";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import { registerAuth } from "./api/client";
import PrivateRoute from "./PrivateRoute";
import Unauthorized from "./Pages/Unauthorized";
import AuthRedirectWrapper from "./AuthRedirectWrapper";
import Dashboard from "./Pages/Auth/Dashboard/Dashboard";
import AuthLayout from "./Pages/Layout/AuthLayout";
import Contact from "./Pages/NonAuth/Contact/Contact";
import ViewAcademics from "./Pages/Auth/Academics/ViewAcademics";
import Calendar from "./Pages/Calendar/Calendar";
import Academics from "./Pages/NonAuth/Academics/Academics";
import AddJourney from "./Pages/Auth/Journey/AddJourney";
import ViewJourney from "./Pages/Auth/Journey/ViewJourney";
import Journey from "./Pages/NonAuth/Journey/Journey";
import AddProjects from "./Pages/Auth/Projects/AddProjects";
import ViewProjects from "./Pages/Auth/Projects/ViewProjects";
import Projects from "./Pages/NonAuth/Projects/Projects";
import AddAchievements from "./Pages/Auth/Achievements/AddAchievements";
import ViewAchievements from "./Pages/Auth/Achievements/ViewAchievements";
import Achievements from "./Pages/NonAuth/Acheivements/Acheivements";
import ProjectDetails from "./Pages/NonAuth/Projects/ProjectDetails";
import AchievementDetails from "./Pages/NonAuth/Acheivements/AchievementDetails";
import AcademicProjects from "./Pages/NonAuth/AcademicProjects/AcademicProjects";
import AcademicProjectDetails from "./Pages/NonAuth/AcademicProjects/AcademicProjectDetails";
import AddAcademicProjects from "./Pages/Auth/AcademicProjects/AddAcademicProjects";
import ViewAcademicProjects from "./Pages/Auth/AcademicProjects/ViewAcademicProjects";
import AboutMe from "./Pages/NonAuth/AboutMe/AboutMe";
import Testimonials from "./Pages/Auth/Testimonials/Testimonials";
import ProfileSettings from "./Pages/Auth/Settings/ProfileSettings";
import PasswordChange from "./Pages/Auth/Settings/PasswordChange";
import SocialLinks from "./Pages/Auth/Settings/SocialLinks";
import NotFound from "./Pages/NonAuth/NotFound/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false },
  },
});

const AuthBridge = ({ children }) => {
  const { accessToken, refreshAccessToken, clearAuth } = useAuthContext();
  useEffect(() => {
    registerAuth(() => accessToken, refreshAccessToken, clearAuth);
  }, [accessToken, refreshAccessToken, clearAuth]);
  return children;
};

const AppRoutes = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/" element={<DefaultLayout />}>
        <Route path="/me" element={<AboutMe />} />
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/achievements/:id" element={<AchievementDetails />} />
        <Route path="/academic-projects" element={<AcademicProjects />} />
        <Route path="/academic-projects/:id" element={<AcademicProjectDetails />} />
        <Route path="/calendar" element={<Calendar />} />
      </Route>

      <Route
        path="/vitra"
        element={
          <AuthRedirectWrapper>
            <Login />
          </AuthRedirectWrapper>
        }
      />

      <Route path="/" element={<AuthLayout />}>
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute roleProps="admin" element={<Dashboard role="admin" />} />
          }
        />
        <Route path="/auth/academics/" element={<PrivateRoute roleProps="admin" element={<ViewAcademics />} />} />
        <Route path="/auth/journey/" element={<PrivateRoute roleProps="admin" element={<ViewJourney />} />} />
        <Route path="/auth/journey/view" element={<PrivateRoute roleProps="admin" element={<ViewJourney />} />} />
        <Route path="/auth/journey/create" element={<PrivateRoute roleProps="admin" element={<AddJourney />} />} />
        <Route path="/auth/projects/" element={<PrivateRoute roleProps="admin" element={<ViewProjects />} />} />
        <Route path="/auth/projects/create" element={<PrivateRoute roleProps="admin" element={<AddProjects />} />} />
        <Route path="/auth/projects/view" element={<PrivateRoute roleProps="admin" element={<ViewProjects />} />} />
        <Route path="/auth/achievements/" element={<PrivateRoute roleProps="admin" element={<ViewAchievements />} />} />
        <Route path="/auth/achievements/create" element={<PrivateRoute roleProps="admin" element={<AddAchievements />} />} />
        <Route path="/auth/achievements/view" element={<PrivateRoute roleProps="admin" element={<ViewAchievements />} />} />
        <Route path="/auth/academic-projects/" element={<PrivateRoute roleProps="admin" element={<ViewAcademicProjects />} />} />
        <Route path="/auth/academic-projects/create" element={<PrivateRoute roleProps="admin" element={<AddAcademicProjects />} />} />
        <Route path="/auth/academic-projects/view" element={<PrivateRoute roleProps="admin" element={<ViewAcademicProjects />} />} />
        <Route path="/auth/testimonials" element={<PrivateRoute roleProps="admin" element={<Testimonials />} />} />
        <Route path="/auth/testimonials/create" element={<PrivateRoute roleProps="admin" element={<Testimonials />} />} />
        <Route path="/auth/testinomial/create" element={<PrivateRoute roleProps="admin" element={<Testimonials />} />} />
        <Route path="/auth/profile" element={<PrivateRoute roleProps="admin" element={<ProfileSettings />} />} />
        <Route path="/auth/password" element={<PrivateRoute roleProps="admin" element={<PasswordChange />} />} />
        <Route path="/auth/social-links" element={<PrivateRoute roleProps="admin" element={<SocialLinks />} />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthBridge>
          <UserProvider>
            <Router>
              <AppRoutes />
            </Router>
          </UserProvider>
        </AuthBridge>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
