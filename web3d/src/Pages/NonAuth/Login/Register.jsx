import React, { useState } from "react";
import { useAuthContext } from "../../../context/AuthContext";
import { motion } from "framer-motion";
import { enqueueSnackbar } from "notistack";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../../Components/Input/InputField";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const { register } = useAuthContext();
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState(null);

  const validationSchema = Yup.object({
    name: Yup.string().required("Full Name is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Confirm Password is required"),
  });

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      const { email, password, name } = values;
      try {
        await register(email, password, name);
        enqueueSnackbar("Registration successful!", { variant: "success" });
        formik.resetForm();
        navigate("/login");
      } catch (error) {
        enqueueSnackbar(`Error: ${error.message}`, { variant: "error" });
        formik.setFieldValue("password", "");
        formik.setFieldValue("confirmPassword", "");
      }
    },
  });

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <motion.div
        className="bg-white p-6 rounded-lg shadow-lg w-96"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold mb-4 text-center">Register</h2>

        <form onSubmit={formik.handleSubmit}>
          <InputField
            name="name"
            type="text"
            label="Full Name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.name}
            touched={formik.touched.name ?? false}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
          />

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

          <InputField
            name="confirmPassword"
            type="password"
            label="Confirm Password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.confirmPassword}
            touched={formik.touched.confirmPassword ?? false}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
          />

          <motion.button
            className={`w-full p-3 rounded-lg transition-all duration-300 ${
              !formik.isValid || formik.isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            type="submit"
            disabled={!formik.isValid || formik.isSubmitting}
            whileHover={{ scale: 1.05 }}
          >
            Register
          </motion.button>
        </form>

        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500 hover:underline">
              Login here
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
