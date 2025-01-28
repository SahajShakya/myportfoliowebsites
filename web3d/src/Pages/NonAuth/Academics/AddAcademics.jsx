import React, { useState, useEffect } from "react";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { supabase } from "../../../supabase/supabase"; // Supabase import
import { db } from "../../../firebase/firebase"; // Firestore import
import { useSnackbar } from "notistack";
import InputField from "../../../Components/Input/InputField"; // Custom input field component
import MyEditor from "../../../Components/MyEditor/MyEditor"; // Custom rich text editor component
import { motion } from "framer-motion";

const AddAcademics = ({ existingData }) => {
  const [editorValue, setEditorValue] = useState(existingData?.contents || "");

  const validationSchema = Yup.object({
    title: Yup.string().required("Title is required"),
    university_name: Yup.string().required("University name is required"),
    college_name: Yup.string().required("College name is required"),
    icon: Yup.mixed()
      .nullable()
      .notRequired()
      .test("fileSize", "File size is too large", (value) => {
        if (value && value.size) {
          return value.size <= 2 * 1024 * 1024; // 2MB max size
        }
        return true;
      })
      .test("fileType", "Invalid file type", (value) => {
        if (value && value.type) {
          return ["image/jpeg", "image/png", "image/gif"].includes(value.type);
        }
        return true;
      }),
    iconBG: Yup.string(),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date()
      .min(Yup.ref("startDate"), "End date must be later than start date")
      .required("End date is required"),
    contents: Yup.string().required("Content is required"),
  });

  const initialValues = {
    title: existingData?.title || "",
    university_name: existingData?.university_name || "",
    college_name: existingData?.college_name || "",
    icon: null,
    iconBG: existingData?.iconBG || "",
    startDate: existingData?.startDate || "",
    endDate: existingData?.endDate || "",
    contents: existingData?.contents || "",
  };

  const handleSubmit = (values) => {
    console.log("Form Submitted: ", values);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Add Academics</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, values, touched, errors }) => (
          <Form className="space-y-6">
            {/* Title */}
            <InputField
              name="title"
              type="text"
              label="Title"
              value={values.title}
              onChange={(e) => setFieldValue("title", e.target.value)}
              onBlur={() => {}}
              error={errors.title}
              touched={touched.title}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            {/* University Name */}
            <InputField
              name="university_name"
              type="text"
              label="University Name"
              value={values.university_name}
              onChange={(e) => setFieldValue("university_name", e.target.value)}
              onBlur={() => {}}
              error={errors.university_name}
              touched={touched.university_name}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            {/* College Name */}
            <InputField
              name="college_name"
              type="text"
              label="College Name"
              value={values.college_name}
              onChange={(e) => setFieldValue("college_name", e.target.value)}
              onBlur={() => {}}
              error={errors.college_name}
              touched={touched.college_name}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            {/* File Input (Icon) */}
            <InputField
              name="icon"
              type="file"
              label="Upload Icon"
              value={values.icon}
              onChange={(e) => setFieldValue("icon", e.currentTarget.files[0])}
              onBlur={() => {}}
              error={errors.icon}
              touched={touched.icon}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
              accept="image/*"
            />

            {/* Start Date */}
            <InputField
              name="startDate"
              type="date"
              label="Start Date"
              value={values.startDate}
              onChange={(e) => setFieldValue("startDate", e.target.value)}
              onBlur={() => {}}
              error={errors.startDate}
              touched={touched.startDate}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            {/* End Date */}
            <InputField
              name="endDate"
              type="date"
              label="End Date"
              value={values.endDate}
              onChange={(e) => setFieldValue("endDate", e.target.value)}
              onBlur={() => {}}
              error={errors.endDate}
              touched={touched.endDate}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            {/* MyEditor for Content */}
            <MyEditor
              value={editorValue}
              onChange={(content) => {
                setEditorValue(content);
                setFieldValue("contents", content);
              }}
              name="contents"
              error={errors.contents}
            />

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              Submit
            </motion.button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddAcademics;
