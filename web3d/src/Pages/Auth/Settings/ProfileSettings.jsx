import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../../Components/Input/InputField";
import { enqueueSnackbar } from "notistack";
import { useUser } from "../../../context/UserContext";
import api from "../../../api/client";
import DraggableUpload from "../../../Components/Upload/DraggableUpload";
import mypic from "../../../assets/mypic.png";

const ProfileSettings = () => {
  const { user, addData } = useUser();
  const [focusedField, setFocusedField] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profile_image || "");

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phone: Yup.string().nullable(),
    bio: Yup.string().nullable(),
    tagline: Yup.string().nullable(),
  });

  const formik = useFormik({
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      bio: "",
      tagline: "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const data = await api.put("/auth/profile", {
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          bio: values.bio || null,
          tagline: values.tagline || null,
          profile_image: profileImage || null,
        });
        addData({
          ...user,
          name: data.user.name,
          email: data.user.email,
        });
        enqueueSnackbar("Profile updated!", { variant: "success" });
      } catch (err) {
        enqueueSnackbar(err.message, { variant: "error" });
      }
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const data = await api.get(`/auth/user/${user.id}`);
        if (data.user) {
          formik.setValues({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            bio: data.user.bio || "",
            tagline: data.user.tagline || "",
          });
          setProfileImage(data.user.profile_image || "");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const handleImageUpload = async (files) => {
    const file = files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api.postForm("/auth/profile-image", formData);
      setProfileImage(data.url);
      enqueueSnackbar("Image uploaded!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border-2 border-gray-300 flex-shrink-0">
            {profileImage ? (
              <img src={profileImage} alt="Current profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-gray-400">{user?.name?.[0] || "?"}</span>
            )}
          </div>
          <div className="flex-1">
            <DraggableUpload
              onFilesChange={handleImageUpload}
              maxFiles={1}
              disabled={uploading}
            />
            {uploading && <span className="text-sm text-gray-500 block mt-1">Uploading...</span>}
            <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 5MB.</p>
          </div>
        </div>
      </div>

      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <InputField
          name="name"
          type="text"
          label="Full Name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.name}
          touched={formik.touched.name ?? false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="email"
          type="email"
          label="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.email}
          touched={formik.touched.email ?? false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="phone"
          type="tel"
          label="Phone"
          value={formik.values.phone}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.phone}
          touched={formik.touched.phone ?? false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <InputField
          name="tagline"
          type="text"
          label="Tagline"
          value={formik.values.tagline}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.tagline}
          touched={formik.touched.tagline ?? false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            name="bio"
            rows={4}
            value={formik.values.bio}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Tell us about yourself..."
          />
        </div>

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50"
        >
          {formik.isSubmitting ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;
