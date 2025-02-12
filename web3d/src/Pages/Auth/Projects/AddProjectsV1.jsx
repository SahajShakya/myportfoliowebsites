import React, { useState } from "react";
import { Formik, Form, FieldArray } from "formik";
import InputField from "../../../Components/Input/InputField"; // Custom input field component
import MyEditor from "../../../Components/MyEditor/MyEditor"; // Custom rich text editor component
import Upload from "../../../Components/Upload/Upload"; // Custom upload component
import * as Yup from "yup";
import { motion } from "framer-motion";
import { uploadFilesToSupabase } from "../../../utils/supabaseFIle";
import { db } from "../../../firebase/firebase";
import { useSnackbar } from "notistack";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";

const Card = ({ children, className }) => {
  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-md border border-black ${className}`}
    >
      {children}
    </div>
  );
};

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string().required("Project Name is required"),
  description: Yup.string().required("Description is required"),
  tags: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required("Tag name is required"),
    })
  ),
  image: Yup.mixed().required("Project image is required"),
  link: Yup.boolean().required("Link flag is required"),
  source_code_link: Yup.string()
    .url("Invalid URL")
    .required("Source code link is required"),
  info: Yup.array().of(
    Yup.object().shape({
      project_id: Yup.string().required("Project ID is required"),
      icons: Yup.array().min(1, "At least one icon is required"),
      contents: Yup.string().required("Content is required"),
    })
  ),
});

const AddProjects = ({ editData, handleEditSuccess }) => {
  const [editorValue, setEditorValue] = useState(
    editData?.info?.contents || ""
  );
  const [uploadUrls, setUploadUrls] = useState([]);

  const { enqueueSnackbar } = useSnackbar();

  const initialValues = {
    name: editData?.name || "",
    description: editData?.description || "",
    tags: editData?.tags || [{ name: "React" }],
    icons: editData?.image || null,
    link: editData?.link || false,
    contents: Yup.string().required("Content is required"),
    source_code_link: editData?.source_code_link || "",
    info: editData?.info || [
      {
        project_id: "", // Get project ID once it's created
        icons: [], // Array for multiple icons
        contents: "",
      },
    ],
  };

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setFieldValue }
  ) => {
    console.log("HIT");
    console.log(values);
    try {
      // Upload images for the project
      let uploadedUrls = [];
      if (values.icons) {
        uploadedUrls = await uploadFilesToSupabase(values.icons, "projects");
      }

      // Prepare project data
      const projectData = {
        name: values.name,
        description: values.description,
        tags: values.tags.map((tag) => tag.name),
        image: uploadedUrls[0] || "",
        link: values.link,
        content: values.contents,
        source_code_link: values.source_code_link,
      };

      // Add project data to the "projects" collection in Firebase
      const projectRef = await addDoc(collection(db, "projects"), projectData);
      const projectId = projectRef.id;

      console.log("Project ID:", projectId);

      // Prepare project details data
      // Prepare project details data for info array
      const projectDetailsData = [];

      for (let info of values.info) {
        // Upload icons inside info[] array (for each info section)
        let infoIconsUrls = [];
        if (info.icons) {
          infoIconsUrls = await uploadFilesToSupabase(info.icons, "projects");
        }

        // Prepare the info data to include uploaded icons
        projectDetailsData.push({
          project_id: projectId,
          icons: infoIconsUrls, // Use the uploaded URLs for this specific info section
          contents: info.contents,
        });
      }

      // Add project details data to the "projectDetails" collection in Firebase
      await Promise.all(
        projectDetailsData.map(async (detail) => {
          await addDoc(collection(db, "projectDetails"), detail);
        })
      );

      enqueueSnackbar("Project added successfully!", {
        variant: "success",
      });

      // Reset form
      resetForm();
      setSubmitting(false);
      window.location.reload();
    } catch (error) {
      console.error("Error submitting form:", error);
      enqueueSnackbar("Failed to submit project data. Please try again.", {
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
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">
        {editData ? "Edit Project" : "Add Project"}
      </h2>
      <Formik
        initialValues={initialValues}
        // validationSchema={validationSchema}
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
            {/* Project Name */}
            <InputField
              name="name"
              type="text"
              label="Project Name"
              value={values.name}
              onChange={(e) => setFieldValue("name", e.target.value)}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            {/* Project Description */}
            <InputField
              name="description"
              type="text"
              label="Description"
              value={values.description}
              onChange={(e) => setFieldValue("description", e.target.value)}
              onBlur={handleBlur}
              error={errors.description}
              touched={touched.description}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            {/* Tags (Array of Tags) */}
            <Card>
              <FieldArray
                name="tags"
                render={(arrayHelpers) => (
                  <div className="space-y-4">
                    {/* Render existing tags */}
                    {values.tags && values.tags.length > 0 ? (
                      values.tags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-4"
                        >
                          <InputField
                            name={`tags[${index}].name`}
                            type="text"
                            label="Tag"
                            value={tag.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            setFocusedField={(name) =>
                              setFieldValue("focusedField", name)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => arrayHelpers.remove(index)} // Remove tag
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <div>No tags yet</div>
                    )}

                    {/* Add Tag button */}
                    <button
                      type="button"
                      onClick={() => arrayHelpers.push({ name: "" })}
                      className="mt-2 text-blue-500 hover:text-blue-700"
                    >
                      Add Tag
                    </button>
                  </div>
                )}
              />
            </Card>
            {/* Project Image Upload */}
            <Upload
              name="icons"
              value={values.icons}
              setFieldValue={setFieldValue}
              error={errors.icons}
              touched={touched.icons}
            />

            {/* Source Code Link */}
            <InputField
              name="source_code_link"
              type="url"
              label="Source Code Link"
              value={values.source_code_link}
              onChange={(e) =>
                setFieldValue("source_code_link", e.target.value)
              }
              onBlur={handleBlur}
              error={errors.source_code_link}
              touched={touched.source_code_link}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
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
            <h1>Details about project here</h1>
            {/* Info Array */}
            <Card>
              <FieldArray
                name="info"
                render={(arrayHelpers) => (
                  <div>
                    {values.info.map((info, index) => (
                      <div key={index} className="space-y-4">
                        {/* Info Icons Upload */}
                        <Upload
                          name={`info[${index}].icons`}
                          value={info.icons}
                          setFieldValue={setFieldValue}
                          error={errors.info?.[index]?.icons}
                          touched={touched.info?.[index]?.icons}
                        />

                        {/* Content Editor */}
                        <MyEditor
                          value={info.contents}
                          onChange={(content) => {
                            setFieldValue(`info[${index}].contents`, content);
                          }}
                          name={`info[${index}].contents`}
                        />

                        {/* Add/Remove Info */}
                        <button
                          type="button"
                          onClick={() => arrayHelpers.remove(index)}
                        >
                          Remove Info
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        arrayHelpers.push({
                          project_id: "",
                          icons: [],
                          contents: "",
                        })
                      }
                    >
                      Add Info
                    </button>
                  </div>
                )}
              />
            </Card>
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

export default AddProjects;
