import React, { useState, useEffect } from "react";
import { getAuth, updateProfile, getIdTokenResult } from "firebase/auth";
import InputField from "../../Input/InputField"; // Your custom InputField
import { useFormik } from "formik";
import * as Yup from "yup";
import { enqueueSnackbar } from "notistack";

const ProfileUpdate = ({ handleCloseModal }) => {
  const [userData, setUserData] = useState({
    name: "",
  });

  const [focusedField, setFocusedField] = useState(null);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // Fetch user data from Firebase Authentication and check admin claim
  useEffect(() => {
    if (userId) {
      // Check if the user is an admin by inspecting their token claims
      getIdTokenResult(auth.currentUser)
        .then((idTokenResult) => {
          if (idTokenResult.claims.admin) {
            setUserData({ name: auth.currentUser.displayName || "" }); // Set displayName as initial value for name
          } else {
            console.log("User is not an admin.");
          }
        })
        .catch((error) => {
          console.error("Error fetching token result:", error);
        });
    }
  }, [userId]);

  // Formik setup for form validation and submission
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: userData?.name || "", // Initial value for display name from Firebase Auth
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
    }),
    onSubmit: async (values) => {
      if (userId) {
        setLoading(true);

        try {
          // Step 1: Update the displayName in Firebase Authentication (Admin Profile)
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
              displayName: values.name, // Update the displayName in Firebase Auth
            });
            enqueueSnackbar("Profile updated successfully!", {
              variant: "success",
            });
            handleCloseModal(); // Close modal after success
          }
        } catch (error) {
          enqueueSnackbar("Update failed. Please try again.", {
            variant: "error",
          });
        } finally {
          setLoading(false);
        }
      }
    },
  });

  // If user data hasn't loaded yet
  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <form onSubmit={formik.handleSubmit}>
        <InputField
          name="name"
          type="text"
          label="Name"
          value={formik.values.name} // Bind input value to formik's state
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
