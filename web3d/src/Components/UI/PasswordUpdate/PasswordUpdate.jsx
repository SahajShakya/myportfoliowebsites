import React, { useState } from "react";
import { enqueueSnackbar } from "notistack";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../Input/InputField";
import api from "../../../api/client";
import { useUser } from "../../../context/UserContext";

const UpdatePassword = ({ handleCloseModal }) => {
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { user } = useUser();

  const formik = useFormik({
    initialValues: {
      password: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .required("Current password is required")
        .min(6, "Password must be at least 6 characters"),
      newPassword: Yup.string()
        .required("New password is required")
        .min(6, "Password must be at least 6 characters"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword"), undefined], "Passwords must match")
        .required("Confirm Password is required"),
    }),

    onSubmit: async (values) => {
      setLoading(true);
      try {
        await api.put(`/auth/user/${user.id}`, {
          password: values.password,
          newPassword: values.newPassword,
        });
        enqueueSnackbar("Password updated successfully!", {
          variant: "success",
        });
        handleCloseModal();
      } catch (error) {
        enqueueSnackbar(error.message || "Update failed", {
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="p-6">
      <form onSubmit={formik.handleSubmit}>
        <InputField
          name="password"
          type="password"
          label="Current Password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.password}
          touched={formik.touched.password || false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="newPassword"
          type="password"
          label="New Password"
          value={formik.values.newPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.newPassword}
          touched={formik.touched.newPassword || false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="confirmPassword"
          type="password"
          label="Confirm New Password"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.confirmPassword}
          touched={formik.touched.confirmPassword || false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default UpdatePassword;
