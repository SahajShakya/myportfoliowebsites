import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../../Components/Input/InputField";
import { enqueueSnackbar } from "notistack";
import api from "../../../api/client";

const PasswordChange = () => {
  const [focusedField, setFocusedField] = useState(null);

  const validationSchema = Yup.object({
    current_password: Yup.string().required("Current password is required"),
    new_password: Yup.string()
      .min(6, "Must be at least 6 characters")
      .required("New password is required"),
    confirm_password: Yup.string()
      .oneOf([Yup.ref("new_password")], "Passwords must match")
      .required("Confirm password is required"),
  });

  const formik = useFormik({
    initialValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await api.put("/auth/password", {
          current_password: values.current_password,
          new_password: values.new_password,
        });
        enqueueSnackbar("Password updated!", { variant: "success" });
        resetForm();
      } catch (err) {
        enqueueSnackbar(err.message, { variant: "error" });
      }
    },
  });

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Change Password</h1>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <InputField
          name="current_password"
          type="password"
          label="Current Password"
          value={formik.values.current_password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.current_password}
          touched={formik.touched.current_password ?? false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="new_password"
          type="password"
          label="New Password"
          value={formik.values.new_password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.new_password}
          touched={formik.touched.new_password ?? false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="confirm_password"
          type="password"
          label="Confirm New Password"
          value={formik.values.confirm_password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.confirm_password}
          touched={formik.touched.confirm_password ?? false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
        >
          {formik.isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default PasswordChange;
