import React, { useState } from "react";
import { Formik, Form, FieldArray } from "formik";
import InputField from "../../../Components/Input/InputField";
import MyEditor from "../../../Components/MyEditor/MyEditor";
import Upload from "../../../Components/Upload/Upload";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { uploadFiles, deleteFilesFromSupabase } from "../../../api/upload";
import { useCreateJourney, useUpdateJourney } from "../../../Hooks/mutations/useJourneyMutations";
import { useSnackbar } from "notistack";
import { FaPlus, FaTrash } from "react-icons/fa";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  office_name: Yup.string().required("Office Name is required"),
  designation: Yup.string().required("Designation is required"),
  icons: Yup.array().min(1, "At least one icon is required"),
  description: Yup.string().required("Description is required"),
  startDate: Yup.date().required("Start Date is required"),
  endDate: Yup.date().optional(),
  contentItems: Yup.array().of(
    Yup.object({
      content_text: Yup.string().required("Content text is required"),
      image_description: Yup.string(),
    })
  ),
  urlofCompany: Yup.string().required("URL of Company is required"),
});

const AddJourney = ({ editData, handleEditSuccess }) => {
  const [editorValue, setEditorValue] = useState(editData?.description || "");
  const { enqueueSnackbar } = useSnackbar();
  const createMutation = useCreateJourney();
  const updateMutation = useUpdateJourney();

  const buildInitialContentItems = () => {
    if (editData?.contents && Array.isArray(editData.contents) && editData.contents.length > 0) {
      return editData.contents.map((item) => ({
        content_text: item.content_text || "",
        image_url: item.image_url ? [{ icon: item.image_url }] : [],
        image_description: item.image_description || "",
        display_order: item.display_order || 0,
      }));
    }
    return [];
  };

  const initialValues = {
    title: editData?.title || "",
    office_name: editData?.office_name || "",
    designation: editData?.designation || "",
    icons:
      editData?.icons?.map((icon) => ({
        icon: typeof icon === "string" ? icon : icon.icon_url || icon,
      })) || [],
    description: editData?.description || "",
    startDate: editData?.start_date || "",
    endDate: editData?.end_date || "",
    contentItems: buildInitialContentItems(),
    focusedField: "",
    urlofCompany: editData?.url_of_company || "",
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      let uploadedIconUrls = [];
      if (values.icons && values.icons.length > 0) {
        const hasNewFiles = values.icons.some((item) => item.file);
        if (hasNewFiles) {
          uploadedIconUrls = await uploadFiles(values.icons, "journey");
        } else {
          uploadedIconUrls = values.icons.map((item) =>
            typeof item === "string" ? item : item.icon
          );
        }
      }
      if (uploadedIconUrls.length === 0 && editData) {
        uploadedIconUrls = editData.icons || [];
      }

      const contentFileItems = [];
      const newContentFiles = [];
      for (let i = 0; i < values.contentItems.length; i++) {
        const item = values.contentItems[i];
        const hasNewImage = item.image_url && item.image_url.some((f) => f.file);
        if (hasNewImage) {
          newContentFiles.push({ index: i, files: item.image_url });
        } else {
          const existingUrl = item.image_url?.[0]?.icon || "";
          contentFileItems.push({ index: i, url: existingUrl });
        }
      }

      const uploadedContentUrls = {};
      if (newContentFiles.length > 0) {
        for (const entry of newContentFiles) {
          const result = await uploadFiles(entry.files, "journey");
          if (result.length > 0) {
            uploadedContentUrls[entry.index] = result[0].url || result[0].path || result[0];
          }
        }
      }
      for (const entry of contentFileItems) {
        uploadedContentUrls[entry.index] = entry.url;
      }

      const contentItems = values.contentItems.map((item, idx) => ({
        content_text: item.content_text,
        image_url: uploadedContentUrls[idx] || "",
        image_description: item.image_description || "",
        display_order: idx,
      }));

      const journeyData = {
        title: values.title,
        office_name: values.office_name,
        designation: values.designation,
        icons: uploadedIconUrls,
        description: editorValue,
        startDate: values.startDate,
        endDate: values.endDate,
        contentItems: contentItems,
        urlofCompany: values.urlofCompany,
      };

      const onSuccess = () => {
        enqueueSnackbar(
          editData ? "Journey updated successfully!" : "Journey created successfully!",
          { variant: "success" }
        );
        setSubmitting(false);
        window.location.reload();
      };

      const onError = (error) => {
        console.error("Error submitting journey:", error);
        enqueueSnackbar("Failed to submit journey. Please try again.", { variant: "error" });
        setSubmitting(false);
      };

      if (editData) {
        updateMutation.mutate({ id: editData.id, payload: journeyData }, { onSuccess, onError });
      } else {
        createMutation.mutate(journeyData, { onSuccess, onError });
      }
    } catch (error) {
      console.error("Error submitting journey:", error);
      enqueueSnackbar("Failed to submit journey. Please try again.", { variant: "error" });
      setSubmitting(false);
    }
  };

  const handleFileRemove = (removedFile) => {
    deleteFilesFromSupabase(removedFile);
  };

  return (
    <div className="w-full">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, values, touched, errors, handleBlur }) => (
          <Form className="space-y-4 sm:space-y-6">
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

            <InputField
              name="office_name"
              type="text"
              label="Office Name"
              value={values.office_name}
              onChange={(e) => setFieldValue("office_name", e.target.value)}
              onBlur={handleBlur}
              error={errors.office_name}
              touched={touched.office_name}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            <InputField
              name="designation"
              type="text"
              label="Designation"
              value={values.designation}
              onChange={(e) => setFieldValue("designation", e.target.value)}
              onBlur={handleBlur}
              error={errors.designation}
              touched={touched.designation}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

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
              label="URL of Company"
              value={values.urlofCompany}
              onChange={(e) => setFieldValue("urlofCompany", e.target.value)}
              onBlur={handleBlur}
              error={errors.urlofCompany}
              touched={touched.urlofCompany}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
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
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
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
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <MyEditor
                value={editorValue}
                onChange={(content) => {
                  setEditorValue(content);
                  setFieldValue("description", content);
                }}
                name="description"
                error={errors.description}
              />
              {touched.description && errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">Content Sections</label>
              </div>

              <FieldArray name="contentItems">
                {({ push, remove }) => (
                  <div className="space-y-4">
                    {values.contentItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50 relative">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                        >
                          <FaTrash size={14} />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Image / Video</label>
                            <Upload
                              name={`contentItems.${index}.image_url`}
                              value={item.image_url || []}
                              setFieldValue={setFieldValue}
                              onFileRemove={handleFileRemove}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Media Description</label>
                            <input
                              type="text"
                              value={item.image_description}
                              onChange={(e) => setFieldValue(`contentItems.${index}.image_description`, e.target.value)}
                              placeholder="Short description for the image"
                              className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                          <textarea
                            value={item.content_text}
                            onChange={(e) => setFieldValue(`contentItems.${index}.content_text`, e.target.value)}
                            placeholder="Write your content here..."
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                          {errors.contentItems?.[index]?.content_text && touched.contentItems?.[index]?.content_text && (
                            <p className="text-red-500 text-xs mt-1">{errors.contentItems[index].content_text}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => push({ content_text: "", image_url: [], image_description: "", display_order: values.contentItems.length })}
                      className="flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm font-medium border border-dashed border-blue-300 rounded-lg px-4 py-2 w-full justify-center hover:bg-blue-50 transition-colors"
                    >
                      <FaPlus /> Add Content Section
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

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

export default AddJourney;
