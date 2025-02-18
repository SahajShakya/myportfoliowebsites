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
      // Check if files are present
      if (values.icons.length > 0) {
        // console.log(values.icons, "Values Icon");
        // Upload the files to Supabase and get the URLs
        const uploadedUrls = await uploadFilesToSupabase(values.icons);

        if (uploadedUrls.length > 0) {
          // Set the uploaded URLs back into Formik
          setUploadUrls(uploadedUrls);
          const academicData = {
            title: values.title,
            university_name: values.university_name,
            college_name: values.college_name,
            icons: uploadedUrls, // Add the uploaded file URLs
            startDate: values.startDate,
            endDate: values.endDate,
            contents: editorValue, // Use the content from the editor
            createdAt: new Date(), // Optionally add a timestamp
            urlofCompany: values.urlofCompany,
          };
          if (editData) {
            // Update the existing document
            await updateDoc(doc(db, "academics", editData.id), academicData);
            handleEditSuccess();
            enqueueSnackbar("Academic data updated successfully!", {
              variant: "success",
            });
          } else {
            await addDoc(collection(db, "academics"), academicData);
          }

          enqueueSnackbar("Academic data submitted successfully!", {
            variant: "success",
          });
          setSubmitting(true); // Optional: show loading state or disable submit button during upload
          // Clear all the form fields after success
          resetForm();
          setFieldValue("title", "");
          setFieldValue("university_name", "");
          setFieldValue("college_name", "");
          setFieldValue("icons", []);
          setFieldValue("startDate", "");
          setFieldValue("endDate", "");
          setFieldValue("contents", "");
          setFieldValue("urlofCompany", "");
          resetForm();

          initialValues.setFieldValue("title", "");
          initialValues.setFieldValue("university_name", "");
          initialValues.setFieldValue("college_name", "");
          initialValues.setFieldValue("icons", "");
          initialValues.setFieldValue("startDate", "");
          initialValues.setFieldValue("endDate", "");
          initialValues.setFieldValue("contents", "");
          initialValues.setFieldValue("urlofCompany", "");
          setEditorValue();

          // Optionally reset the uploaded URLs state
          setUploadUrls([]);
        }
      }

      setSubmitting(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      enqueueSnackbar("Failed to submit academic data. Please try again.", {
        variant: "error",
      });

      setSubmitting(false); // Stop loading on error
    }
  };

  const handleFileRemove = (removedFile) => {
    console.log("URL ontained inside handleFileRemove:", removedFile);
    // setFileRemovedURL(removedFile);
    deleteFileByUrl(removedFile);
    // enqueueSnackbar("Image delete successfully!", {
    //   variant: "success",
    // });
    // Perform any additional logic here, like updating a state or making an API call
  };

  async function deleteFileByUrl(fileUrl) {
    console.log(fileUrl, "File URL on delete fuleVyUrl on delete");
    // Extract the file path from the URL
    const filePath = fileUrl.split("/storage/v1/object/public/storage/")[1];

    // console.log(filePath);

    // // Call Supabase API to delete the file
    const { data, error } = await supabase.storage
      .from("storage") // Your bucket name
      .remove([filePath]);

    console.log(data);

    if (error) {
      console.error("Error deleting file:", error);
    } else {
      console.log("File deleted successfully from supabase");
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">
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
          <Form className="space-y-6">
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
