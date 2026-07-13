import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../../Components/Input/InputField";
import { enqueueSnackbar } from "notistack";
import { useUser } from "../../../context/UserContext";
import { useAuthContext } from "../../../context/AuthContext";
import RoleBasedRedirect from "../../../RoleBasedRedirect";

const Login = () => {
  const { login } = useAuthContext();
  const [focusedField, setFocusedField] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { addData, user } = useUser();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema,
    onSubmit: async (values) => {
      const { email, password } = values;
      try {
        const data = await login(email, password);
        addData({
          email,
          role: data.user.role || "user",
          roleId: "",
          name: data.user.name || "",
          id: data.user.id,
        });
        enqueueSnackbar("Login successful!", { variant: "success" });
        formik.resetForm();
      } catch (error) {
        formik.setFieldValue("password", "");
        enqueueSnackbar(`Error: ${error.message}`, { variant: "error" });
      }
    },
  });

  const handleTitleClick = () => navigate("/");

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <motion.div
        className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-sm"
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

        <form onSubmit={formik.handleSubmit}>
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
          <motion.button
            className={`w-full text-white p-3 rounded-lg transition-all duration-300 ${
              formik.isSubmitting || !formik.isValid
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid}
            whileHover={{ scale: 1.05 }}
          >
            Login
          </motion.button>
        </form>
      </motion.div>
      {user && (
        <RoleBasedRedirect role={user.role || ""} routeName="dashboard" />
      )}
    </div>
  );
};

export default Login;
