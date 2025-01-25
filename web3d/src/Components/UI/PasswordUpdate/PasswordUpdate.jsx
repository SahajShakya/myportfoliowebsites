import React, { useState } from "react";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { enqueueSnackbar } from "notistack";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../Input/InputField"; // Your custom InputField component

const UpdatePassword = ({
  handleCloseModal,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null); // To manage focused state for InputField

  const auth = getAuth();
  const user = auth.currentUser;

  // Formik hook
  const formik = useFormik({
    initialValues: {
      password: "", // Current password
      newPassword: "", // New password
      confirmPassword: "", // Confirm new password
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .required("Current password is required")
        .min(6, "Password must be at least 6 characters"), // Change this to your password policy
      newPassword: Yup.string()
        .required("New password is required")
        .min(6, "Password must be at least 6 characters"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword"), undefined], "Passwords must match")
        .required("Confirm Password is required"),
    }),

    onSubmit: async (values) => {
      if (!user) return;

      setLoading(true);

      try {
        // Step 1: Re-authenticate the user with the current password
        const credential = EmailAuthProvider.credential(
          user.email || "",
          values.password
        );
        await reauthenticateWithCredential(user, credential);

        // Step 2: Update the password
        await updatePassword(user, values.newPassword);

        enqueueSnackbar("Password updated successfully!", {
          variant: "success",
        });
        handleCloseModal(); // Close the modal after successful password update
      } catch (error) {
        enqueueSnackbar(String(error), { variant: "error" });
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="p-6">
      <form onSubmit={formik.handleSubmit}>
        {/* Current Password */}
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

        {/* New Password */}
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

        {/* Confirm New Password */}
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

        {/* Submit Button */}
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
