import React, { useState } from "react";
import { useAuth } from "../../../Hooks/Auth/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../../../firebase/firebase"; // Firebase auth
import { getUserRoleFromFirestore as getUserRoleFromFireStore } from "../../../Hooks/Auth/useAuth"; // Import the role fetching function
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../../Components/Input/InputField"; // Import the reusable InputField component
import { enqueueSnackbar } from "notistack";
import { useUser } from "../../../context/UserContext";
import RoleBasedRedirect from "../../../RoleBasedRedirect";

const Login = () => {
  const { login, error, ActiveUser } = useAuth();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // Missing state for hover
  const navigate = useNavigate();

  const { addData, user } = useUser();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required")
      .matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid email format"
      ),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const { email, password } = values;
      try {
        const userDetails = await login(email, password); // Show success toast
        console.log("User details", userDetails);
        if (auth.currentUser) {
          // Check if email is verified
          if (!auth.currentUser.emailVerified) {
            setEmailNotVerified(true);
            enqueueSnackbar("Email not verified", { variant: "error" });
            formik.setFieldValue("password", "");
          } else {
            // Fetch the user's role from Firestore
            const token = await auth.currentUser.getIdToken();
            localStorage.setItem("authToken", token);
            const tokenExpiry = new Date().getTime() + 30 * 60 * 1000;
            localStorage.setItem("tokenExpiry", tokenExpiry.toString());
            const refreshToken = await auth.currentUser.getIdTokenResult();
            localStorage.setItem("refreshToken", refreshToken.token);
            const idTokenResult = await auth.currentUser.getIdTokenResult();
            const isAdmin = idTokenResult.claims.admin || false;
            const { role, roleId } = await getUserRoleFromFireStore(
              auth.currentUser.uid
            );
            if ((!role || !roleId) && !isAdmin) {
              throw new Error("Unable to fetch user role or roleId");
            }
            const finalrole = isAdmin ? "admin" : role;
            const finalroleId = isAdmin ? "1" : roleId || "";
            const data = {
              email,
              role: finalrole || "",
              roleId: finalroleId,
              name: userDetails?.user?.displayName || "",
            };
            addData(data);
            enqueueSnackbar("Login successful!", { variant: "success" });
            formik.resetForm();
            ActiveUser(
              userDetails.user?.uid,
              userDetails.user?.displayName || "",
              email,
              finalrole || "",
              token
            );

            // if (role === "admin") {
            //   navigate("/admin/dashboard");
            // } else if (role === "patient") {
            //   navigate("/");
            // } else if (role === "doctor") {
            //   navigate("/doctor/dashboard");
            // } else if (role === "employee") {
            //   navigate("/employee");
            // } else {
            //   // Handle unexpected roles (if any)
            //   navigate("/access-denied"); // Optional, handle access denied page
            // }
          }
        }
      } catch (error) {
        formik.setFieldValue("password", "");
        console.log("Formik hit", formik.values);
        enqueueSnackbar(`Error: ${error}`, { variant: "error" }); // Show error toast
      }
    },
  });

  const handleTitleClick = () => {
    navigate("/");
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <motion.div
        className="bg-white p-6 rounded-lg shadow-lg w-96"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2
          className="text-xl font-bold mb-4 text-center cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleTitleClick}
        >
          {isHovered ? "Back to Home" : "Login"}
        </h2>

        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        {emailNotVerified && (
          <p className="text-red-500 mb-4 text-center">
            Your email is not verified. Please verify your email to proceed.
          </p>
        )}

        <form onSubmit={formik.handleSubmit}>
          {/* Email input */}
          <InputField
            name="email"
            type="email"
            label="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.email}
            touched={formik.touched.email ?? false}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
          />

          {/* Password input */}
          <InputField
            name="password"
            type="password"
            label="Password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.password}
            touched={formik.touched.password ?? false}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
          />

          {/* Login button */}
          <motion.button
            className={`w-full text-white p-3 rounded-lg transition-all duration-300 ${
              formik.isSubmitting || !formik.isValid
                ? "bg-gray-400 cursor-not-allowed" // When disabled, use gray background
                : "bg-blue-500 hover:bg-blue-600" // When enabled, use blue background with hover effect
            }`}
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid}
            whileHover={{ scale: 1.05 }}
          >
            Login
          </motion.button>
        </form>

        {/* Register link */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
         
        </motion.div>
      </motion.div>
      {user && (
        <RoleBasedRedirect role={user.role || ""} routeName="dashboard" />
      )}
    </div>
  );
};

export default Login;
