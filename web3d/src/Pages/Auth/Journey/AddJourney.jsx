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
      return editData.contents.map((item) => {
        let images = [];
        let imageTitles = [];
        if (item.image_url) {
          try {
            const parsed = JSON.parse(item.image_url);
            if (Array.isArray(parsed)) {
              images = parsed.map((img) => ({ icon: typeof img === "string" ? img : img.url || "", document_id: item.document_id || null }));
              imageTitles = parsed.map((img) => (typeof img === "string" ? "" : img.title || ""));
            }
          } catch {
            images = [{ icon: item.image_url }];
            imageTitles = [item.image_description || ""];
          }
        }
        return {
          heading: item.heading || "",
          content_text: item.content_text || "",
          image_url: images,
          image_titles: imageTitles,
          display_order: item.display_order || 0,
        };
      });
    }
    return [];
  };

  const initialValues = {
    title: editData?.title || "",
    office_name: editData?.office_name || "",
    designation: editData?.designation || "",
    icons:
      editData?.icons?.map((icon) => ({
        icon: typeof icon === "string" ? icon : icon.icon_url || "",
        document_id: typeof icon === "object" ? (icon.document_id || null) : null,
      })) || [],
    description: editData?.description || "",
    startDate: editData?.start_date || "",
    endDate: editData?.end_date || "",
    contentItems: buildInitialContentItems(),
    focusedField: "",
    urlofCompany: editData?.url_of_company || "",
    backgroundImage: (editData?.background_document_id || editData?.background_image_url)
      ? [{ icon: editData.background_image_url || editData.background_image || "", document_id: editData.background_document_id || null }]
      : [],
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      let uploadedIcons = [];
      if (values.icons && values.icons.length > 0) {
        const hasNewFiles = values.icons.some((item) => item.file);
        if (hasNewFiles) {
          uploadedIcons = await uploadFiles(values.icons, "journey");
        } else {
          uploadedIcons = values.icons.map((item) =>
            typeof item === "string" ? { url: item, document_id: null } : { url: item.icon, document_id: item.document_id || null }
          );
        }
      }
      if (uploadedIcons.length === 0 && editData) {
        uploadedIcons = (editData.icons || []).map((icon) => ({
          url: typeof icon === "string" ? icon : icon.icon_url || "",
          document_id: typeof icon === "object" ? icon.document_id : null,
        }));
      }

      let backgroundImageUrl = editData?.background_image_url || editData?.background_image || null;
      let backgroundDocumentId = editData?.background_document_id || null;
      if (values.backgroundImage && values.backgroundImage.length > 0) {
        const hasNewBg = values.backgroundImage.some((item) => item.file);
        if (hasNewBg) {
          const bgResult = await uploadFiles(values.backgroundImage, "journey");
          backgroundImageUrl = bgResult[0]?.url || bgResult[0]?.path || null;
          backgroundDocumentId = bgResult[0]?.document_id || null;
        } else {
          backgroundImageUrl = values.backgroundImage[0]?.icon || values.backgroundImage[0] || null;
          backgroundDocumentId = values.backgroundImage[0]?.document_id || null;
        }
      }

      const contentItems = [];
      const contentDocumentIds = [];
      for (let i = 0; i < values.contentItems.length; i++) {
        const item = values.contentItems[i];
        let imagesJson = "[]";
        let docIds = [];
        if (item.image_url && item.image_url.length > 0) {
          const hasNew = item.image_url.some((f) => f.file);
          if (hasNew) {
            const result = await uploadFiles(item.image_url, "journey");
            const images = result.map((r, idx) => ({
              url: r.url || r.path || r,
              title: (item.image_titles || [])[idx] || "",
            }));
            imagesJson = JSON.stringify(images);
            docIds = result.map((r) => r.document_id || null);
          } else {
            const images = item.image_url.map((img, idx) => ({
              url: typeof img === "string" ? img : img.icon || "",
              title: (item.image_titles || [])[idx] || "",
            }));
            imagesJson = JSON.stringify(images);
            docIds = item.image_url.map((img) => img.document_id || null);
          }
        }
        contentItems.push({
          heading: item.heading || "",
          content_text: item.content_text || "",
          image_url: imagesJson,
          display_order: i,
        });
        contentDocumentIds.push(docIds);
      }

      const journeyData = {
        title: values.title,
        office_name: values.office_name,
        designation: values.designation,
        icons: uploadedIcons,
        description: editorValue,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        contentItems: contentItems,
        contentDocumentIds: contentDocumentIds,
        urlofCompany: values.urlofCompany,
        backgroundImage: backgroundImageUrl,
        backgroundDocumentId: backgroundDocumentId,
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Image (for timeline card)</label>
              <Upload
                name="backgroundImage"
                value={values.backgroundImage || []}
                setFieldValue={setFieldValue}
                onFileRemove={handleFileRemove}
                maxFiles={1}
              />
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

                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Heading</label>
                          <input
                            type="text"
                            value={item.heading}
                            onChange={(e) => setFieldValue(`contentItems.${index}.heading`, e.target.value)}
                            placeholder="Section heading"
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
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

                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Images / Videos (max 10)</label>
                          <Upload
                            name={`contentItems.${index}.image_url`}
                            value={item.image_url || []}
                            setFieldValue={setFieldValue}
                            onFileRemove={handleFileRemove}
                            maxFiles={10}
                          />
                        </div>

                        <div className="mt-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Image Titles (optional)</label>
                          {item.image_url && item.image_url.length > 0 ? (
                            <div className="space-y-2">
                              {item.image_url.map((img, imgIdx) => (
                                <div key={imgIdx} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                                  <img
                                    src={img.icon || ""}
                                    alt=""
                                    className="w-10 h-10 rounded object-cover border flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <input
                                      type="text"
                                      value={(item.image_titles || [])[imgIdx] || ""}
                                      onChange={(e) => {
                                        const newTitles = [...(item.image_titles || [])];
                                        newTitles[imgIdx] = e.target.value;
                                        setFieldValue(`contentItems.${index}.image_titles`, newTitles);
                                      }}
                                      placeholder={`Title for image ${imgIdx + 1} (optional)`}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic bg-white border border-dashed rounded-lg px-3 py-3 text-center">
                              Upload images above, then add optional titles for each one here
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => push({ heading: "", content_text: "", image_url: [], image_titles: [], display_order: values.contentItems.length })}
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
