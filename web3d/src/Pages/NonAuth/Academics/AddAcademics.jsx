// AddAcademicDetail.js
import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { storage } from "../../../firebase/firebase"; // Firebase storage import
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { motion } from "framer-motion";
import { useSnackbar } from "notistack";
// Reuse your custom InputField component
import InputField from "../../../Components/Input/InputField";
import MyEditor from "../../../Components/MyEditor/MyEditor";

const AddAcademicDetail = ({ isEdit, existingData }) => {
  const { enqueueSnackbar } = useSnackbar(); // Hook to show snackbars
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(existingData?.icon || ""); // For Edit Case
  const [imageDeleted, setImageDeleted] = useState(false); // Track if image is deleted

  // Formik setup
  const formik = useFormik({
    initialValues: {
      title: existingData?.title || "",
      company_name: existingData?.company_name || "",
      icon: null,
      iconBG: existingData?.iconBG || "",
      startDate: existingData?.startDate || "",
      endDate: existingData?.endDate || "",
      points: existingData?.points || "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Title is required"),
      company_name: Yup.string().required("Company Name is required"),
      icon: Yup.mixed().required("Icon is required"),
      iconBG: Yup.string().required("Icon Background is required"),
      startDate: Yup.date().required("Start Date is required"),
      endDate: Yup.date().required("End Date is required"),
      points: Yup.string().required("Points are required"),
    }),
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  // Upload image to Firebase storage
  const uploadIcon = (file) => {
    const storageRef = ref(storage, `icons/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // You can track upload progress here if needed
      },
      (error) => {
        console.log(error);
        setUploading(false);
        enqueueSnackbar("Icon upload failed. Please try again.", {
          variant: "error",
        }); // Show error
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageUrl(downloadURL);
          formik.setFieldValue("icon", downloadURL);
          setUploading(false);
          enqueueSnackbar("Icon uploaded successfully!", {
            variant: "success",
          }); // Show success
        });
      }
    );
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploading(true);
      uploadIcon(file);
    }
  };

  // Handle image delete
  const handleImageDelete = () => {
    if (existingData?.icon) {
      const imageRef = ref(storage, existingData.icon); // Get the reference to the existing image
      deleteObject(imageRef)
        .then(() => {
          setImageUrl(""); // Clear the image URL state
          formik.setFieldValue("icon", null); // Reset the icon field in Formik
          setImageDeleted(true); // Set a flag to indicate image deletion
          enqueueSnackbar("Image deleted successfully!", {
            variant: "success",
          });
        })
        .catch((error) => {
          console.error(error);
          enqueueSnackbar("Failed to delete the image.", { variant: "error" });
        });
    }
  };

  // Submit data to Firestore
  const handleSubmit = (values) => {
    if (!imageUrl && !imageDeleted) {
      enqueueSnackbar("Please upload or delete the icon.", {
        variant: "error",
      });
      return;
    }

    const academicData = {
      ...values,
      icon: imageUrl || null, // If image deleted, set icon to null
    };

    if (isEdit) {
      // Update existing academic detail in Firestore
      // firestore.collection('academics').doc(existingData.id).set(academicData);
      console.log("Editing", academicData);
      enqueueSnackbar("Academic detail updated successfully!", {
        variant: "success",
      });
    } else {
      // Add new academic detail
      // firestore.collection('academics').add(academicData);
      console.log("Adding", academicData);
      enqueueSnackbar("Academic detail added successfully!", {
        variant: "success",
      });
    }
  };

  useEffect(() => {
    if (isEdit && existingData) {
      formik.setValues(existingData); // Set initial values for edit
    }
  }, [isEdit, existingData]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl mb-4">
        {isEdit ? "Edit Academic Detail" : "Add Academic Detail"}
      </h1>
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Title Input */}
        <InputField
          name="title"
          label="Title"
          type="text"
          value={formik.values.title}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.title}
          touched={formik.touched.title}
          focusedField={formik.focusedField}
          setFocusedField={formik.setFieldValue}
        />

        {/* Company Name Input */}
        <InputField
          name="company_name"
          label="Company Name"
          type="text"
          value={formik.values.company_name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.company_name}
          touched={formik.touched.company_name}
          focusedField={formik.focusedField}
          setFocusedField={formik.setFieldValue}
        />

        {/* Existing Image Display and Delete */}
        {isEdit && imageUrl && (
          <div className="relative mb-6">
            <img
              src={imageUrl}
              alt="Uploaded Icon"
              className="w-32 h-32 object-cover rounded-lg mb-2"
            />
            <button
              type="button"
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
              onClick={handleImageDelete}
            >
              X
            </button>
            <p className="text-sm text-gray-500">Click X to delete image</p>
          </div>
        )}

        {/* Icon Upload */}
        {!imageUrl && !imageDeleted && (
          <div className="relative mb-6">
            <input
              type="file"
              id="icon"
              name="icon"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              required
            />
            <label
              htmlFor="icon"
              className="cursor-pointer block w-full p-3 mb-4 border rounded-lg border-gray-300"
            >
              {uploading ? "Uploading..." : "Upload Icon"}
            </label>
            {formik.errors.icon && formik.touched.icon && (
              <p className="text-red-500 text-xs mt-2">{formik.errors.icon}</p>
            )}
          </div>
        )}

        {/* Icon Background Input */}
        <InputField
          name="iconBG"
          label="Icon Background"
          type="text"
          value={formik.values.iconBG}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.iconBG}
          touched={formik.touched.iconBG}
          focusedField={formik.focusedField}
          setFocusedField={formik.setFieldValue}
        />

        {/* Start Date Input */}
        <InputField
          name="startDate"
          label="Start Date"
          type="date"
          value={formik.values.startDate}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.startDate}
          touched={formik.touched.startDate}
          focusedField={formik.focusedField}
          setFocusedField={formik.setFieldValue}
        />

        {/* End Date Input */}
        <InputField
          name="endDate"
          label="End Date"
          type="date"
          value={formik.values.endDate}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.endDate}
          touched={formik.touched.endDate}
          focusedField={formik.focusedField}
          setFocusedField={formik.setFieldValue}
        />

        {/* Points Editor */}
        <MyEditor
          value={formik.values.points}
          onChange={(content) => formik.setFieldValue("points", content)}
        />

        {/* Submit Button */}
        <motion.button
          type="submit"
          className="w-full py-3 bg-blue-500 text-white rounded-lg"
        >
          {isEdit ? "Update Academic Detail" : "Add Academic Detail"}
        </motion.button>
      </form>
    </div>
  );
};

export default AddAcademicDetail;

// call using// In a parent component, pass the appropriate props:

// <AddAcademicDetail isEdit={true} existingData={existingAcademicData} />
