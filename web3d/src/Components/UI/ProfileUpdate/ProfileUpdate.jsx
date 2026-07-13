import React, { useState } from "react";
import InputField from "../../Input/InputField";
import { useFormik } from "formik";
import * as Yup from "yup";
import { enqueueSnackbar } from "notistack";
import api from "../../../api/client";
import { useUser } from "../../../context/UserContext";

const ProfileUpdate = ({ handleCloseModal }) => {
  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: user?.name || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await api.put(`/auth/user/${user.id}`, { name: values.name });
        enqueueSnackbar("Profile updated successfully!", {
          variant: "success",
        });
        handleCloseModal();
      } catch (error) {
        enqueueSnackbar("Update failed. Please try again.", {
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
          name="name"
          type="text"
          label="Name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.name}
          touched={formik.touched.name || false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />
        <button
          type="submit"
          className="mt-4 p-2 bg-blue-500 text-white rounded-md"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default ProfileUpdate;
