import React, { useState } from "react";
import { useFormik } from "formik";
import { db } from "../../../firebase/firebase"; // Import Firebase setup and Firestore functions
import { addDoc, collection } from "firebase/firestore";
import InputField from "../../../Components/Input/InputField"; // Import custom InputField component
import { motion } from "framer-motion";
import { useSnackbar } from "notistack";

const AddTestimonialForm = () => {
  const [focusedField, setFocusedField] = useState("");
  const { enqueueSnackbar } = useSnackbar(); // Get the enqueueSnackbar function from notistack

  const formik = useFormik({
    initialValues: {
      testimonial: "",
      name: "",
      designation: "",
      company: "",
      image: "",
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        await addDoc(collection(db, "testimonials"), {
          testimonial: values.testimonial,
          name: values.name,
          designation: values.designation,
          company: values.company,
          image: values.image,
        });

        // Show success notification with enqueueSnackbar
        enqueueSnackbar("Testimonial added successfully!", {
          variant: "success",
        });

        resetForm();
      } catch (error) {
        console.error("Error adding testimonial: ", error);
        // Show error notification with enqueueSnackbar
        enqueueSnackbar("There was an error adding the testimonial", {
          variant: "error",
        });
      }
    },
  });

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

        <InputField
          name="image"
          type="text"
          label="Image URL"
          value={formik.values.image}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.image}
          touched={formik.touched.image}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

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
