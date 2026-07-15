import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import api from "../../../api/client";
import InputField from "../../../Components/Input/InputField";
import Modal from "../../../Components/UI/Modal/Modal";
import DraggableUpload from "../../../Components/Upload/DraggableUpload";
import { useSnackbar } from "notistack";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [focusedField, setFocusedField] = useState("");

  const fetchTestimonials = async () => {
    try {
      const data = await api.get("/testimonials");
      setTestimonials(data.data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const formik = useFormik({
    initialValues: {
      testimonial: "",
      name: "",
      designation: "",
      company: "",
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        const formData = new FormData();
        formData.append("testimonial", values.testimonial);
        formData.append("name", values.name);
        formData.append("designation", values.designation);
        formData.append("company", values.company);
        if (imageFile) {
          formData.append("image", imageFile);
        }

        if (editingId) {
          await api.put(`/testimonials/${editingId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          enqueueSnackbar("Testimonial updated!", { variant: "success" });
        } else {
          await api.post("/testimonials", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          enqueueSnackbar("Testimonial added!", { variant: "success" });
        }

        resetForm();
        setShowModal(false);
        setEditingId(null);
        setImageFile(null);
        setImagePreview(null);
        fetchTestimonials();
      } catch (error) {
        console.error("Error saving testimonial:", error);
        enqueueSnackbar("Error saving testimonial", { variant: "error" });
      }
    },
  });

  const handleEdit = (t) => {
    setEditingId(t.id);
    formik.setValues({
      testimonial: t.testimonial,
      name: t.name,
      designation: t.designation || "",
      company: t.company || "",
    });
    setImagePreview(t.image || null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this testimonial?")) return;
    try {
      await api.delete(`/testimonials/${id}`);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      enqueueSnackbar("Testimonial deleted!", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Error deleting testimonial", { variant: "error" });
    }
  };

  const handleImageChange = (files) => {
    const file = files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const openAddModal = () => {
    setEditingId(null);
    formik.resetForm();
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
        >
          <FaPlus /> Add Testimonial
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500">Loading...</p>
        ) : testimonials.length === 0 ? (
          <p className="p-6 text-gray-500">No testimonials yet. Click "Add Testimonial" to create one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Image</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Designation</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Testimonial</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {t.image ? (
                      <img
                        src={t.image}
                        alt={t.name}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.designation}</td>
                  <td className="px-4 py-3 text-gray-600">{t.company}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.testimonial}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
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

      {/* Modal */}
      {showModal && (
        <Modal
          title={editingId ? "Edit Testimonial" : "Add Testimonial"}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
            formik.resetForm();
            setImageFile(null);
            setImagePreview(null);
          }}
        >
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <InputField
              name="testimonial"
              type="text"
              label="Testimonial"
              value={formik.values.testimonial}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.testimonial}
              touched={formik.touched.testimonial}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            <InputField
              name="name"
              type="text"
              label="Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.name}
              touched={formik.touched.name}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            <InputField
              name="designation"
              type="text"
              label="Designation"
              value={formik.values.designation}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.designation}
              touched={formik.touched.designation}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            <InputField
              name="company"
              type="text"
              label="Company"
              value={formik.values.company}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.company}
              touched={formik.touched.company}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image
              </label>
              <DraggableUpload
                onFilesChange={handleImageChange}
                existingFiles={imagePreview && !imageFile ? [imagePreview] : []}
                onRemoveExisting={handleRemoveImage}
                maxFiles={1}
                label="Upload photo"
                shape="circle"
                accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  formik.resetForm();
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
              >
                {editingId ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Testimonials;
