/* eslint-disable react/prop-types */
import React, { useState, useRef } from "react";
import { Formik, Form, FieldArray } from "formik";
import InputField from "../../../Components/Input/InputField";
import MyEditor from "../../../Components/MyEditor/MyEditor";
import Upload from "../../../Components/Upload/Upload";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { uploadFiles, deleteFilesFromSupabase } from "../../../api/upload";
import { useCreateProject, useUpdateProject } from "../../../Hooks/mutations/useProjectsMutations";
import { useSnackbar } from "notistack";
import { FaPlus, FaTrash, FaYoutube, FaTimes, FaGripVertical } from "react-icons/fa";
import { detectPlatform } from "../../../Components/UI/EmbedRenderer/EmbedRenderer";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const validationSchema = Yup.object({
  name: Yup.string().required("Project Name is required"),
  category: Yup.string().oneOf(["workproject", "academicsproject"]).required("Category is required"),
  tags: Yup.array()
    .min(1, "At least one tag is required")
    .test(
      "no-empty-tags",
      "Tag cannot be empty",
      (tags) => !tags || tags.every((tag) => typeof tag === "string" && tag.trim() !== "")
    ),
});

const ContentMediaField = ({ index, item, setFieldValue, handleFileRemove, deferDelete, onFileRemoved }) => {
  const [embedInput, setEmbedInput] = useState("");
  const [embedTitle, setEmbedTitle] = useState("");
  const [embedError, setEmbedError] = useState("");
  const [showEmbedForm, setShowEmbedForm] = useState(false);

  const embeds = item.embed_urls || [];

  const handleAddEmbed = () => {
    setEmbedError("");
    const url = embedInput.trim();
    if (!url) {
      setEmbedError("Please enter a URL");
      return;
    }
    const platform = detectPlatform(url);
    if (!platform) {
      setEmbedError("Unsupported URL. Please use YouTube, Facebook, or TikTok links.");
      return;
    }
    const newEmbeds = [...embeds, { type: platform, url, title: embedTitle.trim() }];
    setFieldValue(`contentItems.${index}.embed_urls`, newEmbeds);
    setEmbedInput("");
    setEmbedTitle("");
    setShowEmbedForm(false);
  };

  const handleRemoveEmbed = (embedIdx) => {
    const newEmbeds = embeds.filter((_, i) => i !== embedIdx);
    setFieldValue(`contentItems.${index}.embed_urls`, newEmbeds);
  };

  const handleImageChange = (fieldName, newValue) => {
    setFieldValue(fieldName, newValue);
    const titles = [...(item.image_titles || [])];
    titles.length = newValue.length;
    setFieldValue(`contentItems.${index}.image_titles`, titles);
  };

  return (
    <div className="mb-3 space-y-4">
      {/* Upload Files */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-600">Images</p>
        <Upload
          name={`contentItems.${index}.image_url`}
          value={item.image_url || []}
          setFieldValue={handleImageChange}
          onFileRemove={handleFileRemove}
          maxFiles={15}
          deferDelete={deferDelete}
          onFileRemoved={onFileRemoved}
        />
      </div>

      {/* Embed Video */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-600">Embed Video</p>
        <div className="space-y-2">
          {!showEmbedForm && (
            <button
              type="button"
              onClick={() => setShowEmbedForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-500 border border-blue-300 border-dashed rounded-lg hover:bg-blue-50 transition-colors"
            >
              <FaPlus size={10} /> Add Embed
            </button>
          )}

          {showEmbedForm && (
            <div className="space-y-2 p-3 bg-gray-50 border rounded-lg">
              <input
                type="url"
                value={embedInput}
                onChange={(e) => { setEmbedInput(e.target.value); setEmbedError(""); }}
                placeholder="Paste YouTube, Facebook, or TikTok URL"
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
              <input
                type="text"
                value={embedTitle}
                onChange={(e) => setEmbedTitle(e.target.value)}
                placeholder="Video title (optional)"
                className="w-full px-3 py-2 text-sm border rounded-lg"
              />
              {embedError && <p className="text-xs text-red-500">{embedError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddEmbed}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FaPlus size={10} /> Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEmbedForm(false); setEmbedInput(""); setEmbedTitle(""); setEmbedError(""); }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {embeds.length > 0 && (
            <div className="space-y-2 mt-2">
              {embeds.map((embed, embedIdx) => (
                <div key={embedIdx} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
                  <FaYoutube className={`flex-shrink-0 text-lg ${
                    embed.type === "youtube" ? "text-red-500" :
                    embed.type === "facebook" ? "text-blue-600" :
                    "text-black"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{embed.title || embed.url}</p>
                    <p className="text-[10px] text-gray-400 truncate">{embed.url}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 flex-shrink-0">{embed.type}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmbed(embedIdx)}
                    className="p-1 text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SortableContentSection = ({ id, index, item, remove, setFieldValue, handleFileRemove, handleFileRemoved }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative p-4 border rounded-lg bg-gray-50 ${isDragging ? "shadow-lg" : ""}`}>
      <div className="absolute top-2 right-8 flex items-center gap-1">
        <button
          type="button"
          onClick={() => remove(index)}
          className="p-1 text-red-500 hover:text-red-700"
        >
          <FaTrash size={14} />
        </button>
      </div>

      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600"
      >
        <FaGripVertical size={14} />
      </div>

      <div className="mb-3 ml-6">
        <label className="block mb-1 text-xs font-medium text-gray-600">Heading</label>
        <input
          type="text"
          value={item.heading}
          onChange={(e) => setFieldValue(`contentItems.${index}.heading`, e.target.value)}
          placeholder="Section heading"
          className="w-full px-3 py-2 text-sm border rounded-lg"
        />
      </div>

      <div className="mb-3 ml-6">
        <label className="block mb-1 text-xs font-medium text-gray-600">Description</label>
        <textarea
          value={item.content_text}
          onChange={(e) => setFieldValue(`contentItems.${index}.content_text`, e.target.value)}
          placeholder="Write your content here..."
          rows={3}
          className="w-full px-3 py-2 text-sm border rounded-lg"
        />
      </div>

      <div className="ml-6">
        <ContentMediaField index={index} item={item} setFieldValue={setFieldValue} handleFileRemove={handleFileRemove} deferDelete={true} onFileRemoved={handleFileRemoved} />
      </div>

      {item.image_url && item.image_url.length > 0 && (
        <div className="mt-2 ml-6">
          <label className="block mb-1 text-xs font-semibold text-gray-700">Image Titles (optional)</label>
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
        </div>
      )}
    </div>
  );
};

const AddProjects = ({ editData, handleEditSuccess }) => {
  const [editorValue, setEditorValue] = useState(editData?.description || "");
  const [detailEditorValue, setDetailEditorValue] = useState(editData?.detail || "");
  const { enqueueSnackbar } = useSnackbar();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const pendingDeletions = useRef([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const buildInitialContents = () => {
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
                document_id: typeof img === "object" ? (img.document_id || null) : null,
                type: "existing",
              }));
              imageTitles = parsed.map((img) => (typeof img === "string" ? "" : img.title || ""));
            }
          } catch {
            images = [{ icon: item.image_url, document_id: item.document_id || null, type: "existing" }];
            imageTitles = [item.title || ""];
          }
        }
        return {
          heading: item.heading || "",
          content_text: item.content_text || "",
          image_url: images,
          image_titles: imageTitles,
          embed_urls: (() => {
            try {
              const parsed = typeof item.embed_urls === "string" ? JSON.parse(item.embed_urls) : item.embed_urls;
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })(),
          display_order: item.display_order || 0,
        };
      });
    }
    return [];
  };

  const initialValues = {
    name: editData?.name || "",
    category: editData?.category || "workproject",
    description: editData?.description || "",
    tags: editData?.tags || [],
    icons: editData?.icons?.length > 0
      ? editData.icons.map((icon) => ({
          icon: typeof icon === "string" ? icon : icon.icon_url || "",
          document_id: typeof icon === "object" ? (icon.document_id || null) : null,
        }))
      : [],
    links: editData?.links?.length > 0
      ? editData.links.map((link) => ({ label: link.label || "", url: link.url || "" }))
      : [{ label: "GitHub", url: "" }, { label: "Web", url: "" }, { label: "iOS", url: "" }, { label: "Android", url: "" }],
    contentItems: buildInitialContents(),
    backgroundImage: (editData?.background_document_id || editData?.background_image_url)
      ? [{ icon: editData.background_image_url || "", document_id: editData.background_document_id || null }]
      : [],
    focusedField: "",
  };

  const handleFileRemove = (removedFile) => {
    deleteFilesFromSupabase(removedFile);
  };

  const handleFileRemoved = (removedItem) => {
    pendingDeletions.current.push(removedItem);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (pendingDeletions.current.length > 0) {
        await deleteFilesFromSupabase(pendingDeletions.current);
        pendingDeletions.current = [];
      }

      let uploadedIcons = [];
      if (values.icons && values.icons.length > 0) {
        const hasNewFiles = values.icons.some((item) => item.file);
        if (hasNewFiles) {
          const result = await uploadFiles(values.icons, "projects");
          uploadedIcons = result.map((r) => ({
            url: r.url || r.path || r,
            document_id: r.document_id || null,
          }));
        } else {
          uploadedIcons = values.icons.map((item) => ({
            url: item.icon || "",
            document_id: item.document_id || null,
          }));
        }
      }

      let backgroundImageUrl = editData?.background_image_url || null;
      let backgroundDocumentId = editData?.background_document_id || null;
      if (values.backgroundImage && values.backgroundImage.length > 0) {
        const hasNewBg = values.backgroundImage.some((item) => item.file);
        if (hasNewBg) {
          const bgResult = await uploadFiles(values.backgroundImage, "projects");
          backgroundImageUrl = bgResult[0]?.url || bgResult[0]?.path || null;
          backgroundDocumentId = bgResult[0]?.document_id || null;
        } else {
          backgroundImageUrl = values.backgroundImage[0]?.icon || null;
          backgroundDocumentId = values.backgroundImage[0]?.document_id || null;
        }
      }

      const processedContentItems = [];
      for (let i = 0; i < values.contentItems.length; i++) {
        const item = values.contentItems[i];
        let images = [];

        if (item.image_url && item.image_url.length > 0) {
          const newFiles = item.image_url.filter((f) => f.file);
          let docIds = [];
          if (newFiles.length > 0) {
            const result = await uploadFiles(newFiles, "projects");
            let resultIdx = 0;
            docIds = item.image_url.map((img) => {
              if (img.file) {
                const docId = result[resultIdx]?.document_id || null;
                resultIdx++;
                return docId;
              }
              return img.document_id || null;
            });
          } else {
            docIds = item.image_url.map((img) => img.document_id || null);
          }

          images = item.image_url.map((img, idx) => ({
            url: img.icon || "",
            document_id: docIds[idx] || null,
            title: (item.image_titles || [])[idx] || "",
          }));
        }

        processedContentItems.push({
          heading: item.heading || "",
          content_text: item.content_text || "",
          image_url: images,
          embed_urls: item.embed_urls || [],
          display_order: i,
        });
      }

      const projectData = {
        name: values.name,
        category: values.category,
        description: editorValue,
        detail: detailEditorValue,
        tags: values.tags,
        icons: uploadedIcons,
        links: (values.links || []).filter((l) => l.url && l.url.trim()),
        contentItems: processedContentItems,
        backgroundImage: backgroundImageUrl,
        backgroundDocumentId: backgroundDocumentId,
      };

      const onSuccess = () => {
        enqueueSnackbar(
          editData ? "Project updated successfully!" : "Project created successfully!",
          { variant: "success" }
        );
        setSubmitting(false);
        window.location.reload();
      };

      const onError = (error) => {
        console.error("Error submitting project:", error);
        const msg = error?.response?.data?.error || error?.message || "Failed to submit project. Please try again.";
        enqueueSnackbar(msg, { variant: "error" });
        setSubmitting(false);
      };

      if (editData) {
        updateMutation.mutate({ id: editData.id, payload: projectData }, { onSuccess, onError });
      } else {
        createMutation.mutate(projectData, { onSuccess, onError });
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      enqueueSnackbar("Failed to submit project. Please try again.", { variant: "error" });
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
              label="Project Name"
              value={values.name}
              onChange={(e) => setFieldValue("name", e.target.value)}
              onBlur={handleBlur}
              error={errors.name}
              touched={touched.name}
              focusedField={values.focusedField}
              setFocusedField={(name) => setFieldValue("focusedField", name)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={values.category}
                onChange={(e) => setFieldValue("category", e.target.value)}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 text-sm border rounded-lg ${
                  errors.category && touched.category ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="workproject">Work Project</option>
                <option value="academicsproject">Academic Project</option>
              </select>
              {errors.category && touched.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <MyEditor
                value={editorValue}
                onChange={(content) => {
                  setEditorValue(content);
                  setFieldValue("description", content);
                }}
                name="description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detail</label>
              <MyEditor
                value={detailEditorValue}
                onChange={(content) => {
                  setDetailEditorValue(content);
                  setFieldValue("detail", content);
                }}
                name="detail"
              />
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <Upload
              name="icons"
              value={values.icons}
              setFieldValue={setFieldValue}
              error={errors.icons}
              touched={touched.icons}
              onFileRemove={handleFileRemove}
              deferDelete
              onFileRemoved={handleFileRemoved}
            />

            <div className={`bg-white p-6 rounded-lg shadow-md border ${errors.tags && touched.tags ? "border-red-500" : "border-black"}`}>
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
                            className={`border p-2 rounded flex-1 ${errors.tags && touched.tags ? "border-red-500" : ""}`}
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
                    {errors.tags && touched.tags && (
                      <p className="text-red-500 text-sm">{errors.tags}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Links</label>
              <FieldArray name="links">
                {({ push, remove }) => (
                  <div className="space-y-2">
                    {values.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => setFieldValue(`links.${index}.label`, e.target.value)}
                          placeholder="Label (e.g. GitHub, Web)"
                          className="w-1/3 border rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => setFieldValue(`links.${index}.url`, e.target.value)}
                          placeholder="https://..."
                          className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => push({ label: "", url: "" })}
                      className="flex items-center gap-2 text-blue-500 hover:text-blue-700 text-sm font-medium border border-dashed border-blue-300 rounded-lg px-4 py-2 w-full justify-center hover:bg-blue-50 transition-colors"
                    >
                      <FaPlus /> Add Link
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
              <Upload
                name="backgroundImage"
                value={values.backgroundImage || []}
                setFieldValue={setFieldValue}
                onFileRemove={handleFileRemove}
                maxFiles={1}
                deferDelete
                onFileRemoved={handleFileRemoved}
              />
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Content Sections</label>
              <FieldArray name="contentItems">
                {({ push, remove }) => {
                  const handleDragEnd = (event) => {
                    const { active, over } = event;
                    if (!over || active.id === over.id) return;
                    const oldIndex = values.contentItems.findIndex((_, i) => `content-${i}` === active.id);
                    const newIndex = values.contentItems.findIndex((_, i) => `content-${i}` === over.id);
                    if (oldIndex === -1 || newIndex === -1) return;
                    const reordered = arrayMove(values.contentItems, oldIndex, newIndex).map((item, i) => ({ ...item, display_order: i }));
                    setFieldValue("contentItems", reordered);
                  };

                  return (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={values.contentItems.map((_, i) => `content-${i}`)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                          {values.contentItems.map((item, index) => (
                            <SortableContentSection
                              key={`content-${index}`}
                              id={`content-${index}`}
                              index={index}
                              item={item}
                              remove={remove}
                              setFieldValue={setFieldValue}
                              handleFileRemove={handleFileRemove}
                              handleFileRemoved={handleFileRemoved}
                            />
                          ))}

                          <button
                            type="button"
                            onClick={() => push({ heading: "", content_text: "", image_url: [], image_titles: [], embed_urls: [], display_order: values.contentItems.length })}
                            className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-blue-500 transition-colors border border-blue-300 border-dashed rounded-lg hover:text-blue-700 hover:bg-blue-50"
                          >
                            <FaPlus /> Add Content Section
                          </button>
                        </div>
                      </SortableContext>
                    </DndContext>
                  );
                }}
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

export default AddProjects;
