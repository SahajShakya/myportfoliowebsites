import React, { useState } from "react";
import { Formik, Form } from "formik";
import InputField from "../../../Components/Input/InputField"; // Custom input field component
import MyEditor from "../../../Components/MyEditor/MyEditor"; // Custom rich text editor component
import Upload from "../../../Components/Upload/Upload"; // Custom upload component
import * as Yup from "yup";
import { motion } from "framer-motion";
import { uploadFilesToSupabase } from "../../../utils/supabaseFIle";
import { db } from "../../../firebase/firebase";
import { useSnackbar } from "notistack";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { supabase } from "../../../supabase/supabase";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  university_name: Yup.string().required("University Name is required"),
  college_name: Yup.string().required("College Name is required"),
  icons: Yup.array().min(1, "At least one icon is required"),
  startDate: Yup.date().required("Start Date is required"),
  endDate: Yup.date().required("End Date is required"),
  contents: Yup.string().required("Content is required"), // Add validation for content
  urlofCompany: Yup.string().required("URL of Company is required"),
});

// const initialValues = {
//   title: "",
//   university_name: "",
//   college_name: "",
//   icons: [], // This will be an array to hold file objects
//   startDate: "",
//   endDate: "",
//   contents: "", // Add content field for MyEditor
//   focusedField: "",
//   urlofCompany: "",
// };

const AddAcademics = ({ editData, handleEditSuccess }) => {
  const [editorValue, setEditorValue] = useState(editData?.contents || "");
  const [uploadUrls, setUploadUrls] = useState([]);

  const [fileremovedURL, setFileRemovedURL] = useState("");

  const { enqueueSnackbar } = useSnackbar();

  console.log("Edit data on academics", editData);

  // Set initial values for the form
  const initialValues = {
    title: editData?.title || "",
    university_name: editData?.university_name || "",
    college_name: editData?.college_name || "",
    icons: editData?.icons?.map((icon) => ({ icon: icon.publicUrl })) || [],
    startDate: editData?.startDate || "",
    endDate: editData?.endDate || "",
    contents: editData?.contents || "",
    focusedField: "",
    urlofCompany: editData?.urlofCompany || "",
  };

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setFieldValue }
  ) => {
    try {
      // Initialize an array to store the uploaded file URLs
      let uploadedUrls = [];

      // Check if there are new files to upload
      if (values.icons && values.icons.length > 0) {
        // Upload new files and get the URLs
        uploadedUrls = await uploadFilesToSupabase(values.icons, "academics");
      }

      // If no new files were uploaded, retain the existing URLs (from editData)
      if (uploadedUrls.length === 0 && editData) {
        uploadedUrls = editData.icons || []; // Keep old URLs if no new images
      }

      // Prepare the data for saving (includes both the form data and file URLs)
      const academicData = {
        title: values.title,
        university_name: values.university_name,
        college_name: values.college_name,
        icons: uploadedUrls, // Use the updated (or old) URLs
        startDate: values.startDate,
        endDate: values.endDate,
        contents: editorValue, // Assuming editorValue is the content from a rich text editor
        urlofCompany: values.urlofCompany,
      };

      // Check if we are editing an existing record or adding a new one
      if (editData) {
        // Update the existing document in Firestore with the new academicData
        await updateDoc(doc(db, "academics", editData.id), academicData);
        enqueueSnackbar("Academic data updated successfully!", {
          variant: "success",
        });

        // If the update was successful, clear the file list in the Upload component
        setFieldValue("icons", []);
      } else {
        // Add a new document to the "academics" collection in Firestore
        await addDoc(collection(db, "academics"), academicData);
        enqueueSnackbar("Academic data submitted successfully!", {
          variant: "success",
        });
      }

      // Reset the form fields to initial values
      setFieldValue("title", "");
      setFieldValue("university_name", "");
      setFieldValue("college_name", "");
      setFieldValue("icons", []);
      setFieldValue("startDate", "");
      setFieldValue("endDate", "");
      setFieldValue("contents", "");
      setFieldValue("urlofCompany", "");

      // Reset the rich text editor value (assuming setEditorValue clears it)
      setEditorValue("");

      // Reset form and handle submission state
      resetForm();
      setSubmitting(false);
      window.location.reload();
    } catch (error) {
      // Handle errors during submission
      console.error("Error submitting form:", error);
      enqueueSnackbar("Failed to submit academic data. Please try again.", {
        variant: "error",
      });
      setSubmitting(false);
    }
  };

  const handleFileRemove = (removedFile) => {
    console.log("URL ontained inside handleFileRemove:", removedFile);
    // setFileRemovedURL(removedFile);
    deleteFileByUrl(removedFile);

    // Perform any additional logic here, like updating a state or making an API call
  };

  async function deleteFileByUrl(fileUrl) {
    // Extract the file path from the URL
    const filePath = fileUrl.split("/storage/v1/object/public/storage/")[1];

    console.log(filePath, "File Path on delete");

    // // Call Supabase API to delete the file
    const { data, error } = await supabase.storage
      .from("storage") // Your bucket name
      .remove([filePath]);

    console.log("data", data);
    enqueueSnackbar("Image delete successfully!", {
      variant: "success",
    });

    if (error) {
      console.error("Error deleting file:", error);
    } else {
      console.log("File deleted successfully from supabase");
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
        {editData ? "Edit Academic" : "Add Academic"}
      </h2>
      <Formik
        initialValues={initialValues}
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
          <Form className="space-y-4 sm:space-y-6">
            {/* Title */}
            <InputField
              name="title"
              type="text"
              label="Title"
              value={values.title}
              onChange={(e) => setFieldValue("title", e.target.value)}
              onBlur={handleBlur}
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
              onBlur={handleBlur}
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
              onBlur={handleBlur}
              error={errors.college_name}
              touched={touched.college_name}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            {/* File Input (Icons) */}
            <Upload
              name="icons"
              value={values.icons}
              setFieldValue={setFieldValue}
              error={errors.icons}
              touched={touched.icons}
              onFileRemove={handleFileRemove}
            />

            <InputField
              name="urlofCompany"
              type="text"
              label="urlofCompany"
              value={values.urlofCompany}
              onChange={(e) => setFieldValue("urlofCompany", e.target.value)}
              onBlur={handleBlur}
              error={errors.urlofCompany}
              touched={touched.urlofCompany}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            {/* Start Date */}
            <InputField
              name="startDate"
              type="date"
              label="Start Date"
              value={values.startDate}
              onChange={(e) => setFieldValue("startDate", e.target.value)}
              onBlur={handleBlur}
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
              onBlur={handleBlur}
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
            {touched.contents && errors.contents && (
              <p className="text-red-500 text-sm mt-2">{errors.contents}</p>
            )}

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
