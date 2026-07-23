/* eslint-disable react/prop-types */
import { useState } from "react";
import { Formik, Form, FieldArray } from "formik";
import InputField from "../../../Components/Input/InputField";
import MyEditor from "../../../Components/MyEditor/MyEditor";
import Upload from "../../../Components/Upload/Upload";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { uploadFiles, deleteFilesFromSupabase } from "../../../api/upload";
import { useCreateAcademic, useUpdateAcademic } from "../../../Hooks/mutations/useAcademicsMutations";
import { useSnackbar } from "notistack";
import { FaPlus, FaTrash } from "react-icons/fa";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  university_name: Yup.string().required("University Name is required"),
  college_name: Yup.string().required("College Name is required"),
  icons: Yup.array().min(1, "At least one icon is required"),
  startDate: Yup.date().required("Start Date is required"),
  endDate: Yup.date().required("End Date is required"),
  description: Yup.string().required("Description is required"),
  urlofCompany: Yup.string().required("URL of Company is required"),
});

const AddAcademics = ({ editData }) => {
  const [editorValue, setEditorValue] = useState(editData?.description || "");
  const { enqueueSnackbar } = useSnackbar();
  const createMutation = useCreateAcademic();
  const updateMutation = useUpdateAcademic();

  const buildInitialContentItems = () => {
    if (editData?.contents && Array.isArray(editData.contents) && editData.contents.length > 0) {
      return editData.contents.map((item) => {
        let images = [];
        let imageTitles = [];
        if (item.image_url) {
          try {
            const parsed = JSON.parse(item.image_url);
            if (Array.isArray(parsed)) {
              images = parsed.map((img) => ({
                icon: typeof img === "string" ? img : img.url || "",
                document_id: item.document_id || null,
              }));
              imageTitles = parsed.map((img) => (typeof img === "string" ? "" : img.title || ""));
            }
          } catch {
            images = [{ icon: item.image_url, document_id: item.document_id || null }];
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
    university_name: editData?.university_name || "",
    college_name: editData?.college_name || "",
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
          try {
            uploadedIcons = await uploadFiles(values.icons, "academics");
          } catch (uploadErr) {
            console.error("Icon upload failed:", uploadErr);
            enqueueSnackbar(`Icon upload failed: ${uploadErr.message}`, { variant: "error" });
            setSubmitting(false);
            return;
          }
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
          try {
            const bgResult = await uploadFiles(values.backgroundImage, "academics");
            backgroundImageUrl = bgResult[0]?.url || bgResult[0]?.path || null;
            backgroundDocumentId = bgResult[0]?.document_id || null;
            if (!backgroundDocumentId) {
              console.error("Background image uploaded but no document_id returned:", bgResult);
              enqueueSnackbar("Background image uploaded but failed to create document record. Please try again.", { variant: "warning" });
            }
          } catch (uploadErr) {
            console.error("Background image upload failed:", uploadErr);
            enqueueSnackbar(`Background image upload failed: ${uploadErr.message}`, { variant: "error" });
            setSubmitting(false);
            return;
          }
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
            try {
              const result = await uploadFiles(item.image_url, "academics");
              const images = result.map((r, idx) => ({
                url: r.url || r.path || r,
                title: (item.image_titles || [])[idx] || "",
              }));
              imagesJson = JSON.stringify(images);
              docIds = result.map((r) => r.document_id || null);
            } catch (uploadErr) {
              console.error(`Content section ${i + 1} image upload failed:`, uploadErr);
              enqueueSnackbar(`Content section ${i + 1} image upload failed: ${uploadErr.message}`, { variant: "error" });
              setSubmitting(false);
              return;
            }
          } else {
            const images = item.image_url.map((img, idx) => ({
              url: typeof img === "string" ? img : img.icon || "",
              title: (item.image_titles || [])[idx] || "",
              document_id: img.document_id || null,
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

      const academicData = {
        title: values.title,
        university_name: values.university_name,
        college_name: values.college_name,
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
          editData ? "Academic updated successfully!" : "Academic created successfully!",
          { variant: "success" }
        );
        setSubmitting(false);
        window.location.reload();
      };

      const onError = (error) => {
        console.error("Error submitting academic:", error);
        const msg = error?.response?.data?.error || error?.message || "Failed to submit academic. Please try again.";
        enqueueSnackbar(msg, { variant: "error" });
        setSubmitting(false);
      };

      if (editData) {
        updateMutation.mutate({ id: editData.id, payload: academicData }, { onSuccess, onError });
      } else {
        createMutation.mutate(academicData, { onSuccess, onError });
      }
    } catch (error) {
      console.error("Error submitting academic:", error);
      enqueueSnackbar(`Submit failed: ${error.message}`, { variant: "error" });
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
              <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
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
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Background Image (for timeline card)</label>
              <Upload
                name="backgroundImage"
                value={values.backgroundImage || []}
                setFieldValue={setFieldValue}
                onFileRemove={handleFileRemove}
                maxFiles={1}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">Content Sections</label>
              </div>

              <FieldArray name="contentItems">
                {({ push, remove }) => (
                  <div className="space-y-4">
                    {values.contentItems.map((item, index) => (
                      <div key={index} className="relative p-4 border rounded-lg bg-gray-50">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="absolute p-1 text-red-500 top-2 right-2 hover:text-red-700"
                        >
                          <FaTrash size={14} />
                        </button>

                        <div className="mb-3">
                          <label className="block mb-1 text-xs font-medium text-gray-600">Heading</label>
                          <input
                            type="text"
                            value={item.heading}
                            onChange={(e) => setFieldValue(`contentItems.${index}.heading`, e.target.value)}
                            placeholder="Section heading"
                            className="w-full px-3 py-2 text-sm border rounded-lg"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block mb-1 text-xs font-medium text-gray-600">Description</label>
                          <textarea
                            value={item.content_text}
                            onChange={(e) => setFieldValue(`contentItems.${index}.content_text`, e.target.value)}
                            placeholder="Write your content here..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border rounded-lg"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block mb-1 text-xs font-medium text-gray-600">Images / Videos (max 10)</label>
                          <Upload
                            name={`contentItems.${index}.image_url`}
                            value={item.image_url || []}
                            setFieldValue={setFieldValue}
                            onFileRemove={handleFileRemove}
                            maxFiles={10}
                          />
                        </div>

                        <div className="mt-2">
                          <label className="block mb-1 text-xs font-semibold text-gray-700">Image Titles (optional)</label>
                          {item.image_url && item.image_url.length > 0 ? (
                            <div className="space-y-2">
                              {item.image_url.map((img, imgIdx) => (
                                <div key={imgIdx} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
                                  <img
                                    src={img.icon || ""}
                                    alt=""
                                    className="flex-shrink-0 object-cover w-10 h-10 border rounded"
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
                                      className="w-full px-2 py-1 text-sm border rounded"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="px-3 py-3 text-xs italic text-center text-gray-400 bg-white border border-dashed rounded-lg">
                              Upload images above, then add optional titles for each one here
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => push({ heading: "", content_text: "", image_url: [], image_titles: [], display_order: values.contentItems.length })}
                      className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-blue-500 transition-colors border border-blue-300 border-dashed rounded-lg hover:text-blue-700 hover:bg-blue-50"
                    >
                      <FaPlus /> Add Content Section
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            <motion.button
              type="submit"
              className="w-full p-3 text-white transition-all bg-blue-500 rounded-lg hover:bg-blue-600"
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
