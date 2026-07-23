import React, { useState } from "react";
import { Formik, Form, FieldArray } from "formik";
import InputField from "../../../Components/Input/InputField";
import MyEditor from "../../../Components/MyEditor/MyEditor";
import Upload from "../../../Components/Upload/Upload";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { uploadFiles, deleteFilesFromSupabase } from "../../../api/upload";
import { useCreateAchievement, useUpdateAchievement } from "../../../Hooks/mutations/useAchievementsMutations";
import { useSnackbar } from "notistack";
import { FaPlus, FaTrash } from "react-icons/fa";

const Card = ({ children, className }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md border border-black ${className}`}>
    {children}
  </div>
);

const validationSchema = Yup.object({
  name: Yup.string().required("Achievement Name is required"),
  description: Yup.string().required("Description is required"),
  tags: Yup.array().min(1, "At least one tag is required"),
  icons: Yup.array().min(1, "Icon is required"),
  source_code_link: Yup.string().url("Must be a valid URL"),
  contents: Yup.string().required("Content is required"),
});

const AddAchievements = ({ editData, handleEditSuccess }) => {
  const [editorValue, setEditorValue] = useState(editData?.contents || "");
  const { enqueueSnackbar } = useSnackbar();
  const createMutation = useCreateAchievement();
  const updateMutation = useUpdateAchievement();

  const buildInitialDetails = () => {
    if (editData?.details && Array.isArray(editData.details) && editData.details.length > 0) {
      return editData.details.map((item) => {
        let images = [];
        let imageTitles = [];
        if (item.image_url) {
          try {
            const parsed = JSON.parse(item.image_url);
            if (Array.isArray(parsed)) {
              images = parsed.map((img) => ({ icon: typeof img === "string" ? img : img.url || "" }));
              imageTitles = parsed.map((img) => (typeof img === "string" ? "" : img.title || ""));
            }
          } catch {
            images = [{ icon: item.image_url }];
            imageTitles = [item.image_description || ""];
          }
        }
        return {
          heading: item.heading || "",
          content_text: item.contents || "",
          image_url: images,
          image_titles: imageTitles,
          display_order: item.display_order || 0,
        };
      });
    }
    return [{ heading: "", content_text: "", image_url: [], image_titles: [], display_order: 0 }];
  };

  const initialValues = {
    name: editData?.name || "",
    description: editData?.description || "",
    tags: editData?.tags || [],
    icons: editData?.icons ? [{ icon: editData.icons }] : [],
    link: editData?.link || false,
    contents: editData?.contents || "",
    source_code_link: editData?.source_code_link || "",
    details: buildInitialDetails(),
    focusedField: "",
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      let uploadedIconUrl = "";
      if (values.icons && values.icons.length > 0) {
        const hasNewFiles = values.icons.some((item) => item.file);
        if (hasNewFiles) {
          const result = await uploadFiles(values.icons, "achievements");
          if (result.length > 0) uploadedIconUrl = result[0].url || result[0].path || result[0];
        } else {
          uploadedIconUrl = values.icons.map((item) =>
            typeof item === "string" ? item : item.icon
          )[0] || "";
        }
      }

      const detailItems = [];
      for (let i = 0; i < values.details.length; i++) {
        const item = values.details[i];
        let imagesJson = "[]";
        let docIds = [];
        if (item.image_url && item.image_url.length > 0) {
          const hasNew = item.image_url.some((f) => f.file);
          if (hasNew) {
            const result = await uploadFiles(item.image_url, "achievements");
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
        detailItems.push({
          contents: item.content_text,
          heading: item.heading || "",
          image_url: imagesJson,
          document_ids: docIds.filter(Boolean),
          document_id: docIds[0] || null,
          display_order: i,
        });
      }

      const achievementData = {
        name: values.name,
        description: values.description,
        tags: values.tags,
        icons: uploadedIconUrl,
        link: values.link,
        contents: editorValue,
        source_code_link: values.source_code_link,
        details: detailItems,
      };

      const onSuccess = () => {
        enqueueSnackbar(
          editData ? "Achievement updated successfully!" : "Achievement created successfully!",
          { variant: "success" }
        );
        setSubmitting(false);
        window.location.reload();
      };

      const onError = (error) => {
        console.error("Error submitting achievement:", error);
        enqueueSnackbar("Failed to submit achievement. Please try again.", { variant: "error" });
        setSubmitting(false);
      };

      if (editData) {
        updateMutation.mutate({ id: editData.id, payload: achievementData }, { onSuccess, onError });
      } else {
        createMutation.mutate(achievementData, { onSuccess, onError });
      }
    } catch (error) {
      console.error("Error submitting achievement:", error);
      enqueueSnackbar("Failed to submit achievement. Please try again.", { variant: "error" });
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ setFieldValue, values, touched, errors, handleBlur }) => (
          <Form className="space-y-4 sm:space-y-6">
            <InputField
              name="name"
              type="text"
              label="Achievement Name"
              value={values.name}
              onChange={(e) => setFieldValue("name", e.target.value)}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

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

            <Card>
              <FieldArray
                name="tags"
                render={(arrayHelpers) => (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">Tags</label>
                    {values.tags && values.tags.length > 0 ? (
                      values.tags.map((tag, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <input
                            name={`tags[${index}]`}
                            value={tag}
                            onChange={(e) => setFieldValue(`tags[${index}]`, e.target.value)}
                            onBlur={handleBlur}
                            className="border p-2 rounded flex-1"
                            placeholder="Tag"
                          />
                          <button
                            type="button"
                            onClick={() => arrayHelpers.remove(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">No tags added</p>
                    )}
                    <button
                      type="button"
                      onClick={() => arrayHelpers.push("")}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      + Add Tag
                    </button>
                  </div>
                )}
              />
            </Card>

            <Upload
              name="icons"
              value={values.icons}
              setFieldValue={setFieldValue}
              error={errors.icons}
              touched={touched.icons}
            />

            <InputField
              name="source_code_link"
              type="url"
              label="Source Code Link (Optional)"
              value={values.source_code_link}
              onChange={(e) => setFieldValue("source_code_link", e.target.value)}
              onBlur={handleBlur}
              error={errors.source_code_link}
              touched={touched.source_code_link}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
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
                <p className="text-red-500 text-sm mt-1">{errors.contents}</p>
              )}
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Content Sections</label>
              <FieldArray name="details">
                {({ push, remove }) => (
                  <div className="space-y-4">
                    {values.details.map((item, index) => (
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
                            onChange={(e) => setFieldValue(`details.${index}.heading`, e.target.value)}
                            placeholder="Section heading"
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <textarea
                            value={item.content_text}
                            onChange={(e) => setFieldValue(`details.${index}.content_text`, e.target.value)}
                            placeholder="Write your content here..."
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Images / Videos (max 10)</label>
                          <Upload
                            name={`details.${index}.image_url`}
                            value={item.image_url || []}
                            setFieldValue={setFieldValue}
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
                                        setFieldValue(`details.${index}.image_titles`, newTitles);
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
                      onClick={() => push({ heading: "", content_text: "", image_url: [], image_titles: [], display_order: values.details.length })}
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

export default AddAchievements;
