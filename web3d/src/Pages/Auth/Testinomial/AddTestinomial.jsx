import React, { useState } from "react";
import { useFormik } from "formik";
import api from "../../../api/client";
import InputField from "../../../Components/Input/InputField";
import { motion } from "framer-motion";
import { useSnackbar } from "notistack";

const AddTestimonialForm = () => {
  const [focusedField, setFocusedField] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const formik = useFormik({
    initialValues: {
      testimonial: "",
      name: "",
      designation: "",
      company: "",
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        const formData = new FormData();
        formData.append("testimonial", values.testimonial);
        formData.append("name", values.name);
        formData.append("designation", values.designation);
        formData.append("company", values.company);
        if (imageFile) {
          formData.append("image", imageFile);
        }

        await api.post("/testimonials", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        enqueueSnackbar("Testimonial added successfully!", {
          variant: "success",
        });
        resetForm();
        setImagePreview(null);
        setImageFile(null);
      } catch (error) {
        console.error("Error adding testimonial: ", error);
        enqueueSnackbar("There was an error adding the testimonial", {
          variant: "error",
        });
      }
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-2xl">
      <motion.h2
        className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Add Testimonial
      </motion.h2>

      <form onSubmit={formik.handleSubmit} className="space-y-4 sm:space-y-6">
        <InputField
          name="testimonial"
          type="text"
          label="Testimonial"
          value={formik.values.testimonial}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.testimonial}
          touched={formik.touched.testimonial}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="name"
          type="text"
          label="Name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.name}
          touched={formik.touched.name}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="designation"
          type="text"
          label="Designation"
          value={formik.values.designation}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.designation}
          touched={formik.touched.designation}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="company"
          type="text"
          label="Company"
          value={formik.values.company}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.company}
          touched={formik.touched.company}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile Image
          </label>
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 transition-colors">
                <span className="text-2xl text-gray-400">+</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
            <span className="text-sm text-gray-500">
              {imageFile ? imageFile.name : "Upload a photo"}
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full p-3 bg-blue-500 text-white rounded-md mt-4 hover:bg-blue-600 transition-colors"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default AddTestimonialForm;
