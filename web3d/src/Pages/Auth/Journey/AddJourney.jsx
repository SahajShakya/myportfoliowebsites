/* eslint-disable react/prop-types */
// eslint-disable-next-line no-unused-vars
import React, { useState, useRef } from "react";
import { Formik, Form, FieldArray } from "formik";
import InputField from "../../../Components/Input/InputField";
import MyEditor from "../../../Components/MyEditor/MyEditor";
import Upload from "../../../Components/Upload/Upload";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { uploadFiles, deleteFilesFromSupabase } from "../../../api/upload";
import { useCreateJourney, useUpdateJourney } from "../../../Hooks/mutations/useJourneyMutations";
import { useSnackbar } from "notistack";
import { FaPlus, FaTrash, FaYoutube, FaTimes, FaGripVertical } from "react-icons/fa";
import { detectPlatform } from "../../../Components/UI/EmbedRenderer/EmbedRenderer";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  office_name: Yup.string().required("Office Name is required"),
  icons: Yup.array().min(1, "At least one icon is required"),
  description: Yup.string().required("Description is required"),
  links: Yup.array().of(
    Yup.object({
      label: Yup.string(),
      url: Yup.string().url("Must be a valid URL"),
    })
  ),
  promotions: Yup.array().of(
    Yup.object({
      position: Yup.string().required("Position is required"),
      start_date: Yup.date().required("Start date is required"),
      end_date: Yup.date().optional(),
      contentItems: Yup.array().of(
        Yup.object({
          heading: Yup.string(),
          content_text: Yup.string(),
        })
      ),
    })
  ),
});

const SortablePromoContentSection = ({ id, promoIndex, index, item, remove, setFieldValue, handleFileRemove, handleFileRemoved }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
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
    setFieldValue(`promotions.${promoIndex}.contentItems.${index}.embed_urls`, newEmbeds);
    setEmbedInput("");
    setEmbedTitle("");
    setShowEmbedForm(false);
  };

  const handleRemoveEmbed = (embedIdx) => {
    const newEmbeds = embeds.filter((_, i) => i !== embedIdx);
    setFieldValue(`promotions.${promoIndex}.contentItems.${index}.embed_urls`, newEmbeds);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative p-3 border rounded bg-white ${isDragging ? "shadow-lg" : ""}`}>
      <div className="absolute flex items-center gap-1 top-2 right-2">
        <button
          type="button"
          onClick={() => remove(index)}
          className="p-1 text-red-400 hover:text-red-600"
        >
          <FaTrash size={12} />
        </button>
      </div>

      <div
        {...attributes}
        {...listeners}
        className="absolute p-1 text-gray-400 top-2 left-2 cursor-grab active:cursor-grabbing hover:text-gray-600"
      >
        <FaGripVertical size={14} />
      </div>

      <div className="mb-2 ml-7">
        <label className="block mb-1 text-xs font-medium text-gray-600">Heading</label>
        <input
          type="text"
          value={item.heading}
          onChange={(e) => setFieldValue(`promotions.${promoIndex}.contentItems.${index}.heading`, e.target.value)}
          placeholder="Section heading"
          className="w-full px-2 py-1 text-xs border rounded"
        />
      </div>

      <div className="mb-2 ml-7">
        <label className="block mb-1 text-xs font-medium text-gray-600">Description</label>
        <textarea
          value={item.content_text}
          onChange={(e) => setFieldValue(`promotions.${promoIndex}.contentItems.${index}.content_text`, e.target.value)}
          placeholder="Write your content here..."
          rows={2}
          className="w-full px-2 py-1 text-xs border rounded"
        />
      </div>

      <div className="mb-2 ml-7">
        <label className="block mb-1 text-xs font-medium text-gray-600">Images / Videos (max 10)</label>
        <Upload
          name={`promotions.${promoIndex}.contentItems.${index}.image_url`}
          value={item.image_url || []}
          setFieldValue={setFieldValue}
          onFileRemove={handleFileRemove}
          maxFiles={10}
          deferDelete
          onFileRemoved={handleFileRemoved}
        />
      </div>

      <div className="ml-7">
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

      <div className="ml-7">
        <label className="block mb-1 text-xs font-semibold text-gray-600">Image Titles (optional)</label>
        {item.image_url && item.image_url.length > 0 ? (
          <div className="space-y-1">
            {item.image_url.map((img, imgIdx) => (
              <div key={imgIdx} className="flex items-center gap-2 px-2 py-1 border rounded bg-gray-50">
                <img
                  src={img.icon || ""}
                  alt=""
                  className="flex-shrink-0 object-cover w-6 h-6 border rounded"
                />
                <input
                  type="text"
                  value={(item.image_titles || [])[imgIdx] || ""}
                  onChange={(e) => {
                    const newTitles = [...(item.image_titles || [])];
                    newTitles[imgIdx] = e.target.value;
                    setFieldValue(`promotions.${promoIndex}.contentItems.${index}.image_titles`, newTitles);
                  }}
                  placeholder={`Title for image ${imgIdx + 1}`}
                  className="flex-1 border rounded px-2 py-0.5 text-xs"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs italic text-gray-400">
            Upload images above to add titles
          </p>
        )}
      </div>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const AddJourney = ({ editData, handleEditSuccess }) => {
  const [editorValue, setEditorValue] = useState(editData?.description || "");
  const { enqueueSnackbar } = useSnackbar();
  const createMutation = useCreateJourney();
  const updateMutation = useUpdateJourney();
  const pendingDeletions = useRef([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const initialValues = {
    title: editData?.title || "",
    office_name: editData?.office_name || "",
    icons:
      editData?.icons?.map((icon) => ({
        icon: typeof icon === "string" ? icon : icon.icon_url || "",
        document_id: typeof icon === "object" ? (icon.document_id || null) : null,
      })) || [],
    description: editData?.description || "",
    focusedField: "",
    links: editData?.links?.length > 0
      ? editData.links.map((link) => ({ label: link.label || "", url: link.url || "" }))
      : [{ label: "Website", url: "" }],
    promotions: editData?.promotions?.length > 0
      ? editData.promotions.map((p) => ({
          position: p.position || p.designation || "",
          description: p.description || "",
          start_date: p.start_date || p.year || "",
          end_date: p.end_date || p.endYear || "",
          contentItems: (p.content_items || []).map((item) => ({
            heading: item.heading || "",
            content_text: item.content_text || "",
            image_url: (item.image_url || []).map((img) => ({
              icon: typeof img === "string" ? img : img.url || "",
              title: typeof img === "string" ? "" : (img.title || ""),
              document_id: typeof img === "object" ? (img.document_id || null) : null,
            })),
            image_titles: (item.image_url || []).map((img) =>
              typeof img === "string" ? "" : (img.title || "")
            ),
            embed_urls: (() => {
              try {
                const parsed = typeof item.embed_urls === "string" ? JSON.parse(item.embed_urls) : item.embed_urls;
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })(),
            display_order: item.display_order || 0,
          })),
        }))
      : [],
    backgroundImage: (editData?.background_document_id || editData?.background_image_url)
      ? [{ icon: editData.background_image_url || editData.background_image || "", document_id: editData.background_document_id || null }]
      : [],
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

      const promotionData = [];
      for (const promo of (values.promotions || []).filter((p) => p.position)) {
        const promoContentItems = [];
        for (const item of (promo.contentItems || [])) {
          let images = [];
          let imageTitles = [];
          if (item.image_url && item.image_url.length > 0) {
            const hasNew = item.image_url.some((f) => f.file);
            if (hasNew) {
              const result = await uploadFiles(item.image_url, "journey");
              images = result.map((r, idx) => ({
                url: r.url || r.path || r,
                title: (item.image_titles || [])[idx] || "",
                document_id: r.document_id || null,
              }));
            } else {
              images = item.image_url.map((img, idx) => ({
                url: typeof img === "string" ? img : img.icon || "",
                title: (item.image_titles || [])[idx] || "",
                document_id: typeof img === "object" ? (img.document_id || null) : null,
              }));
            }
            imageTitles = images.map((img) => img.title);
          }
          promoContentItems.push({
            heading: item.heading || "",
            content_text: item.content_text || "",
            image_url: images,
            image_titles: imageTitles,
            embed_urls: Array.isArray(item.embed_urls) ? item.embed_urls : [],
            display_order: promoContentItems.length,
          });
        }
        promotionData.push({
          start_date: promo.start_date,
          end_date: promo.end_date || null,
          position: promo.position,
          description: promo.description || "",
          contentItems: promoContentItems,
        });
      }

      const journeyData = {
        title: values.title,
        office_name: values.office_name,
        icons: uploadedIcons,
        description: editorValue,
        contentItems: [],
        contentDocumentIds: [],
        links: (values.links || []).filter((l) => l.url && l.url.trim()),
        promotions: promotionData,
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

  const handleFileRemoved = (removedItem) => {
    pendingDeletions.current.push(removedItem);
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

            <label className="block mb-1 text-sm font-medium text-gray-700">Icon</label>
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

            <div className="pt-4 border-t">
              <label className="block mb-3 text-sm font-semibold text-gray-700">Links</label>
              <FieldArray name="links">
                {({ push, remove }) => (
                  <div className="space-y-2">
                    {values.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => setFieldValue(`links.${index}.label`, e.target.value)}
                          placeholder="Label (e.g. GitHub, Website)"
                          className="w-1/3 px-3 py-2 text-sm border rounded-lg"
                        />
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => setFieldValue(`links.${index}.url`, e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-3 py-2 text-sm border rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => push({ label: "", url: "" })}
                      className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-blue-500 transition-colors border border-blue-300 border-dashed rounded-lg hover:text-blue-700 hover:bg-blue-50"
                    >
                      <FaPlus /> Add Link
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

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
                deferDelete
                onFileRemoved={handleFileRemoved}
              />
            </div>

            <div className="pt-4 border-t">
              <label className="block mb-3 text-sm font-semibold text-gray-700">Working Position Details</label>
              <FieldArray name="promotions">
                {({ push, remove }) => (
                  <div className="space-y-6">
                    {values.promotions.map((promo, promoIndex) => (
                      <div key={promoIndex} className="relative p-4 border rounded-lg bg-gray-50">
                        <button
                          type="button"
                          onClick={() => remove(promoIndex)}
                          className="absolute p-1 text-red-500 top-2 right-2 hover:text-red-700"
                        >
                          <FaTrash size={14} />
                        </button>

                        <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-3">
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-600">Position</label>
                            <input
                              type="text"
                              value={promo.position}
                              onChange={(e) => setFieldValue(`promotions.${promoIndex}.position`, e.target.value)}
                              placeholder="e.g. Internship"
                              className="w-full px-3 py-2 text-sm border rounded-lg"
                            />
                            {errors.promotions?.[promoIndex]?.position && touched.promotions?.[promoIndex]?.position && (
                              <p className="mt-1 text-xs text-red-500">{errors.promotions[promoIndex].position}</p>
                            )}
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-600">Start Date</label>
                            <input
                              type="date"
                              value={promo.start_date}
                              onChange={(e) => setFieldValue(`promotions.${promoIndex}.start_date`, e.target.value)}
                              className="w-full px-3 py-2 text-sm border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium text-gray-600">End Date</label>
                            <input
                              type="date"
                              value={promo.end_date}
                              onChange={(e) => setFieldValue(`promotions.${promoIndex}.end_date`, e.target.value)}
                              className="w-full px-3 py-2 text-sm border rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="block mb-1 text-xs font-medium text-gray-600">Description</label>
                          <textarea
                            value={promo.description}
                            onChange={(e) => setFieldValue(`promotions.${promoIndex}.description`, e.target.value)}
                            placeholder="Brief description of this role..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm border rounded-lg"
                          />
                        </div>

                        <div className="pt-3 border-t">
                          <label className="block mb-2 text-xs font-semibold text-gray-700">Content Sections</label>
                          <FieldArray name={`promotions.${promoIndex}.contentItems`}>
                            {({ push: pushContent, remove: removeContent }) => {
                              const handleDragEnd = (event) => {
                                const { active, over } = event;
                                if (!over || active.id === over.id) return;
                                const items = promo.contentItems || [];
                                const oldIndex = items.findIndex((_, i) => `promo-${promoIndex}-content-${i}` === active.id);
                                const newIndex = items.findIndex((_, i) => `promo-${promoIndex}-content-${i}` === over.id);
                                if (oldIndex === -1 || newIndex === -1) return;
                                const reordered = arrayMove(items, oldIndex, newIndex).map((item, i) => ({ ...item, display_order: i }));
                                setFieldValue(`promotions.${promoIndex}.contentItems`, reordered);
                              };
                              return (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                  <SortableContext items={(promo.contentItems || []).map((_, i) => `promo-${promoIndex}-content-${i}`)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-3">
                                      {(promo.contentItems || []).map((contentItem, contentIndex) => (
                                        <SortablePromoContentSection
                                          key={`promo-${promoIndex}-content-${contentIndex}`}
                                          id={`promo-${promoIndex}-content-${contentIndex}`}
                                          promoIndex={promoIndex}
                                          index={contentIndex}
                                          item={contentItem}
                                          remove={removeContent}
                                          setFieldValue={setFieldValue}
                                          handleFileRemove={handleFileRemove}
                                          handleFileRemoved={handleFileRemoved}
                                        />
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => pushContent({ heading: "", content_text: "", image_url: [], image_titles: [], embed_urls: [], display_order: (promo.contentItems || []).length })}
                                        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 text-xs font-medium border border-dashed border-blue-300 rounded px-3 py-1.5 w-full justify-center hover:bg-blue-50 transition-colors"
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
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => push({ position: "", start_date: "", end_date: "", contentItems: [] })}
                      className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-medium text-blue-500 transition-colors border border-blue-300 border-dashed rounded-lg hover:text-blue-700 hover:bg-blue-50"
                    >
                      <FaPlus /> Add Working Position Detail
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

export default AddJourney;
