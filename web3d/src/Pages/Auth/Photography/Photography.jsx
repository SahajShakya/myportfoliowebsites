import React, { useState } from "react";
import { useFormik } from "formik";
import InputField from "../../../Components/Input/InputField";
import Modal from "../../../Components/UI/Modal/Modal";
import DraggableUpload from "../../../Components/Upload/DraggableUpload";
import MyEditor from "../../../Components/MyEditor/MyEditor";
import { useSnackbar } from "notistack";
import { FaPlus, FaEdit, FaTrash, FaCamera, FaTimes, FaImage } from "react-icons/fa";
import { usePhotographyQuery } from "../../../Hooks/options/usePhotographyQuery";
import { useCreatePhotography, useUpdatePhotography, useDeletePhotography } from "../../../Hooks/mutations/usePhotographyMutations";

const Photography = () => {
  const { data: posts = [], isLoading } = usePhotographyQuery();
  const createMutation = useCreatePhotography();
  const updateMutation = useUpdatePhotography();
  const deleteMutation = useDeletePhotography();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const [focusedField, setFocusedField] = useState("");

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
    },
    onSubmit: (values, { resetForm }) => {
      if (imageFiles.length === 0) {
        enqueueSnackbar("Please add at least one photo", { variant: "warning" });
        return;
      }

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);

      const photoItems = imageFiles.map((f, idx) => {
        if (f.file) {
          return { type: "new", caption: f.caption || "", display_order: idx };
        }
        return { type: "existing", url: f.url, caption: f.caption || "", display_order: idx, document_id: f.document_id || null };
      });
      formData.append("photos", JSON.stringify(photoItems));

      const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
      formData.append("tags", JSON.stringify(tags));

      for (const f of imageFiles) {
        if (f.file) {
          formData.append("photos[]", f.file);
        }
      }

      const onSuccess = () => {
        resetForm();
        setShowModal(false);
        setEditingId(null);
        setImageFiles([]);
        setTagInput("");
      };

      if (editingId) {
        updateMutation.mutate(
          { id: editingId, payload: formData },
          {
            onSuccess: () => {
              enqueueSnackbar("Post updated!", { variant: "success" });
              onSuccess();
            },
            onError: () => {
              enqueueSnackbar("Error saving post", { variant: "error" });
            },
          }
        );
      } else {
        createMutation.mutate(formData, {
          onSuccess: () => {
            enqueueSnackbar("Post created!", { variant: "success" });
            onSuccess();
          },
          onError: () => {
            enqueueSnackbar("Error saving post", { variant: "error" });
          },
        });
      }
    },
  });

  const handleEdit = (post) => {
    setEditingId(post.id);
    formik.setValues({
      title: post.title,
      description: post.description || "",
    });
    const existingPhotos = (post.photos || []).map((p) => ({
      url: p.photo_url,
      caption: p.caption || "",
      document_id: p.document_id || null,
      type: "existing",
    }));
    setImageFiles(existingPhotos);
    const tags = (post.tags || []).map((t) => t.tag).join(", ");
    setTagInput(tags);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this photography post?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        enqueueSnackbar("Post deleted!", { variant: "success" });
      },
      onError: () => {
        enqueueSnackbar("Error deleting post", { variant: "error" });
      },
    });
  };

  const handleFilesChange = (files) => {
    const newItems = files.map((f) => ({
      file: f,
      caption: "",
      type: "new",
    }));
    setImageFiles((prev) => {
      const existing = prev.filter((p) => p.type === "existing");
      return [...existing, ...newItems];
    });
  };

  const handleRemovePhoto = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCaption = (index, caption) => {
    setImageFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption } : f))
    );
  };

  const openAddModal = () => {
    setEditingId(null);
    formik.resetForm();
    setImageFiles([]);
    setTagInput("");
    setShowModal(true);
  };

  const newFileCount = imageFiles.filter((f) => f.type === "new").length;
  const existingCount = imageFiles.filter((f) => f.type === "existing").length;
  const totalPhotos = newFileCount + existingCount;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Photography</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
        >
          <FaPlus /> New Post
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-gray-500">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="p-6 text-gray-500">No posts yet. Click "New Post" to create one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Photos</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {post.photos && post.photos.length > 0 ? (
                        <>
                          <img
                            src={post.photos[0].photo_url}
                            alt={post.title}
                            className="w-10 h-10 rounded-lg object-cover border"
                          />
                          {post.photos.length > 1 && (
                            <span className="text-xs text-gray-500 font-medium">
                              +{post.photos.length - 1}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                          <FaImage size={14} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{post.title}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                    {post.description ? post.description.replace(/<[^>]*>/g, "") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(post.tags || []).slice(0, 3).map((t, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {t.tag}
                        </span>
                      ))}
                      {(post.tags || []).length > 3 && (
                        <span className="text-xs text-gray-400">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal
          title={editingId ? "Edit Post" : "New Post"}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
            formik.resetForm();
            setImageFiles([]);
            setTagInput("");
          }}
        >
          <form onSubmit={formik.handleSubmit} className="space-y-5">
            <InputField
              name="title"
              type="text"
              label="Title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.title}
              touched={formik.touched.title}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            <div className="border rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2">
                <FaCamera className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Photos</span>
                <span className="text-xs text-gray-400 ml-auto">{totalPhotos} photo(s)</span>
              </div>

              {imageFiles.length > 0 && (
                <div className="p-3 grid grid-cols-3 gap-2">
                  {imageFiles.map((photo, idx) => {
                    const previewUrl = photo.file
                      ? URL.createObjectURL(photo.file)
                      : photo.url;
                    return (
                      <div key={idx} className="relative group aspect-square">
                        <img
                          src={previewUrl}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
                        >
                          <FaTimes size={10} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 opacity-0 group-hover:opacity-100 transition rounded-b-lg">
                          <input
                            type="text"
                            placeholder="Add caption..."
                            value={photo.caption || ""}
                            onChange={(e) => handleUpdateCaption(idx, e.target.value)}
                            className="w-full bg-transparent text-white text-xs placeholder-white/60 outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="p-3 border-t">
                <DraggableUpload
                  onFilesChange={handleFilesChange}
                  maxFiles={10 - totalPhotos}
                  label="Upload photos"
                  accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"] }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <MyEditor
                value={formik.values.description}
                onChange={(content) => formik.setFieldValue("description", content)}
                name="description"
                error={formik.errors.description}
              />
            </div>

            <div className="relative mb-6">
              <label
                className={`absolute left-3 transition-all duration-300 ${
                  tagInput.length > 0
                    ? "top-0 text-sm text-blue-500"
                    : "top-1/4 transform -translate-y-1/4 text-gray-500"
                }`}
              >
                Tags (comma separated)
              </label>
              <input
                type="text"
                name="tagInput"
                className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 border-gray-300"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              {tagInput && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {tagInput
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  formik.resetForm();
                  setImageFiles([]);
                  setTagInput("");
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
              >
                {editingId ? "Update" : "Post"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Photography;
