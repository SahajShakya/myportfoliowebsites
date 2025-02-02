import React, { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import InputField from "../../../Components/Input/InputField"; // Custom input field component
import MyEditor from "../../../Components/MyEditor/MyEditor"; // Custom rich text editor component
import Upload from "../../../Components/Upload/Upload"; // Custom upload component
import * as Yup from "yup";
import { motion } from "framer-motion";
import {
  uploadFilesToSupabase,
  deleteFileFromSupabase,
} from "../../../utils/supabaseFile"; // Assuming the utility functions are here
import { db } from "../../../firebase/firebase";
import { useSnackbar } from "notistack";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  university_name: Yup.string().required("University Name is required"),
  college_name: Yup.string().required("College Name is required"),
  icons: Yup.array().min(1, "At least one icon is required"),
  startDate: Yup.date().required("Start Date is required"),
  endDate: Yup.date().required("End Date is required"),
  contents: Yup.string().required("Content is required"),
  urlofCompany: Yup.string().required("URL of Company is required"),
});

const initialValues = {
  title: "",
  university_name: "",
  college_name: "",
  icons: [],
  startDate: "",
  endDate: "",
  contents: "",
  focusedField: "",
  urlofCompany: "",
};

const AddAcademics = ({ academicData = null, isEdit = false }) => {
  const [editorValue, setEditorValue] = useState("");
  const [uploadUrls, setUploadUrls] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  console.log(academicData);

  useEffect(() => {
    if (isEdit && academicData) {
      // Populate form with existing data for editing
      setEditorValue(academicData.contents);
      setUploadUrls(academicData.icons);
    }
  }, [isEdit, academicData]);

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setFieldValue }
  ) => {
    try {
      // Handle file upload
      const newIcons = values.icons.filter((file) => file instanceof File);

      // Delete removed files from Supabase
      const removedIcons = uploadUrls.filter(
        (url) => !values.icons.includes(url)
      );
      await Promise.all(
        removedIcons.map(async (iconUrl) => {
          await deleteFileFromSupabase(iconUrl); // Delete removed file from Supabase
        })
      );

      // Upload new icons if necessary
      let uploadedUrls = uploadUrls;
      if (newIcons.length > 0) {
        const uploadedFiles = await uploadFilesToSupabase(newIcons);
        uploadedUrls = [...uploadedUrls, ...uploadedFiles];
      }

      // Prepare the data to be submitted
      const academicData = {
        title: values.title,
        university_name: values.university_name,
        college_name: values.college_name,
        icons: uploadedUrls,
        startDate: values.startDate,
        endDate: values.endDate,
        contents: editorValue,
        createdAt: new Date(),
      };

      // If it's edit mode, update the document
      if (isEdit && academicData.id) {
        const academicRef = doc(db, "academics", academicData.id);
        await updateDoc(academicRef, academicData);
        enqueueSnackbar("Academic data updated successfully!", {
          variant: "success",
        });
      } else {
        // If it's add mode, add a new document
        await addDoc(collection(db, "academics"), academicData);
        enqueueSnackbar("Academic data submitted successfully!", {
          variant: "success",
        });
      }

      // Reset form after submit
      resetForm();
      setUploadUrls([]);
      setEditorValue("");
      setSubmitting(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      enqueueSnackbar("Failed to submit academic data. Please try again.", {
        variant: "error",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">
        {isEdit ? "Edit Academics" : "Add Academics"}
      </h2>
      <Formik
        initialValues={academicData || initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          setFieldValue,
          values,
          touched,
          errors,
          handleBlur,
          handleChange,
        }) => (
          <Form className="space-y-6">
            <InputField
              name="title"
              type="text"
              label="Title"
              value={values.title}
              onChange={(e) => setFieldValue("title", e.target.value)}
              onBlur={handleBlur}
              error={errors.title}
              touched={touched.title}
            />
            <InputField
              name="university_name"
              type="text"
              label="University Name"
              value={values.university_name}
              onChange={(e) => setFieldValue("university_name", e.target.value)}
              onBlur={handleBlur}
              error={errors.university_name}
              touched={touched.university_name}
            />
            <InputField
              name="college_name"
              type="text"
              label="College Name"
              value={values.college_name}
              onChange={(e) => setFieldValue("college_name", e.target.value)}
              onBlur={handleBlur}
              error={errors.college_name}
              touched={touched.college_name}
            />
            <Upload
              name="icons"
              value={values.icons}
              setFieldValue={setFieldValue}
              error={errors.icons}
              touched={touched.icons}
            />
            <InputField
              name="urlofCompany"
              type="text"
              label="URL of Company"
              value={values.urlofCompany}
              onChange={(e) => setFieldValue("urlofCompany", e.target.value)}
              onBlur={handleBlur}
              error={errors.urlofCompany}
              touched={touched.urlofCompany}
            />
            <InputField
              name="startDate"
              type="date"
              label="Start Date"
              value={values.startDate}
              onChange={(e) => setFieldValue("startDate", e.target.value)}
              onBlur={handleBlur}
              error={errors.startDate}
              touched={touched.startDate}
            />
            <InputField
              name="endDate"
              type="date"
              label="End Date"
              value={values.endDate}
              onChange={(e) => setFieldValue("endDate", e.target.value)}
              onBlur={handleBlur}
              error={errors.endDate}
              touched={touched.endDate}
            />
            <MyEditor
              value={editorValue}
              onChange={(content) => {
                setEditorValue(content);
                setFieldValue("contents", content);
              }}
              name="contents"
              error={errors.contents}
            />
            {touched.contents && errors.contents && (
              <p className="text-red-500 text-sm mt-2">{errors.contents}</p>
            )}
            <motion.button
              type="submit"
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              {isEdit ? "Edit" : "Submit"}
            </motion.button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AddAcademics;
