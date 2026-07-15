import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { enqueueSnackbar } from "notistack";
import { useUser } from "../../../context/UserContext";
import api from "../../../api/client";
import DraggableUpload from "../../../Components/Upload/DraggableUpload";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaFilePdf,
  FaUpload,
  FaCheckCircle,
  FaEdit,
  FaImage,
  FaSave,
  FaTimes,
  FaLink,
} from "react-icons/fa";
import mypic from "../../../assets/mypic.png";

const Dashboard = ({ role }) => {
  const { user, addData } = useUser();
  const [profile, setProfile] = useState({});
  const [cvs, setCvs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [cvUploading, setCvUploading] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await api.get(`/auth/user/${user.id}`);
      if (data.user) setProfile(data.user);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCvs = async () => {
    try {
      const data = await api.get("/auth/cvs");
      setCvs(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCvs();
  }, []);

  const handleImageUpload = async (files) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api.postForm("/auth/profile-image", formData);
      setProfile((prev) => ({ ...prev, profile_image: data.url }));
      enqueueSnackbar("Profile image updated!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleCvUpload = async (files) => {
    const file = files[0];
    if (!file) return;
    setCvUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(/\.[^.]+$/, ""));
      formData.append("is_active", cvs.length === 0 ? "true" : "false");
      const data = await api.postForm("/auth/cvs", formData);
      setCvs((prev) => [data.data, ...prev]);
      enqueueSnackbar("CV uploaded!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    } finally {
      setCvUploading(false);
    }
  };

  const handleCvDelete = async (id) => {
    if (!confirm("Delete this CV?")) return;
    try {
      await api.delete(`/auth/cvs/${id}`);
      setCvs((prev) => prev.filter((cv) => cv.id !== id));
      enqueueSnackbar("CV deleted!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  };

  const handleCvSetActive = async (id) => {
    try {
      await api.put(`/auth/cvs/${id}`, { is_active: true });
      setCvs((prev) =>
        prev.map((cv) => ({ ...cv, is_active: cv.id === id }))
      );
      enqueueSnackbar("Active CV set!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative group">
            <img
              src={profile.profile_image || mypic}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <p className="text-gray-500">{profile.email}</p>
            {profile.phone && (
              <p className="text-gray-400 text-sm">{profile.phone}</p>
            )}
            <div className="mt-2">
              <DraggableUpload
                onFilesChange={handleImageUpload}
                maxFiles={1}
                label="Profile Image"
                disabled={uploading}
              />
              {uploading && <span className="text-xs text-gray-500">Uploading...</span>}
            </div>
          </div>
        </div>

        <InlineProfileEditor
          profile={profile}
          setProfile={setProfile}
          editingField={editingField}
          setEditingField={setEditingField}
          addData={addData}
        />
      </div>

      {/* CV Management */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FaFilePdf className="text-red-500" /> CV / Resume
          </h2>
        </div>

        <DraggableUpload
          onFilesChange={handleCvUpload}
          existingFiles={cvs.map((cv) => cv.file_url)}
          onRemoveExisting={async (url, idx) => {
            const cv = cvs[idx];
            if (cv) await handleCvDelete(cv.id);
          }}
          maxFiles={1}
          label="Upload CV"
          disabled={cvUploading}
          accept={{
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
          }}
        />
        {cvUploading && <span className="text-xs text-gray-500 mt-1 block">Uploading...</span>}
      </div>

      {/* Materials URL */}
      <MaterialsUrlEditor profile={profile} setProfile={setProfile} addData={addData} />

      {/* About Background Image */}
      <AboutBgImageEditor />

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="/auth/profile"
          className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition flex items-center gap-3"
        >
          <FaUser className="text-blue-500 text-xl" />
          <div>
            <div className="font-medium">Profile Settings</div>
            <div className="text-xs text-gray-400">Edit name, bio, tagline</div>
          </div>
        </a>
        <a
          href="/auth/social-links"
          className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition flex items-center gap-3"
        >
          <FaEdit className="text-purple-500 text-xl" />
          <div>
            <div className="font-medium">Social Links</div>
            <div className="text-xs text-gray-400">GitHub, LinkedIn, etc.</div>
          </div>
        </a>
        <a
          href="/auth/password"
          className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition flex items-center gap-3"
        >
          <FaCheckCircle className="text-green-500 text-xl" />
          <div>
            <div className="font-medium">Change Password</div>
            <div className="text-xs text-gray-400">Update credentials</div>
          </div>
        </a>
      </div>
    </div>
  );
};

const InlineProfileEditor = ({
  profile,
  setProfile,
  editingField,
  setEditingField,
  addData,
}) => {
  const [editValue, setEditValue] = useState("");

  const fields = [
    { key: "name", label: "Name", icon: FaUser, type: "text" },
    { key: "email", label: "Email", icon: FaEnvelope, type: "email" },
    { key: "phone", label: "Phone", icon: FaPhone, type: "tel" },
  ];

  const startEdit = (field) => {
    setEditingField(field.key);
    setEditValue(profile[field.key] || "");
  };

  const saveField = async (field) => {
    try {
      const payload = {
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || null,
        bio: profile.bio || null,
        tagline: profile.tagline || null,
        profile_image: profile.profile_image || null,
      };
      payload[field.key] = editValue || null;

      const data = await api.put("/auth/profile", payload);
      setProfile((prev) => ({ ...prev, [field.key]: editValue }));
      addData({
        ...profile,
        name: data.user.name,
        email: data.user.email,
      });
      setEditingField(null);
      enqueueSnackbar(`${field.label} updated!`, { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  };

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div
          key={field.key}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
        >
          <field.icon className="text-gray-400 w-5" />
          <span className="text-gray-500 w-16 text-sm">{field.label}</span>
          {editingField === field.key ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type={field.type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveField(field);
                  if (e.key === "Escape") setEditingField(null);
                }}
              />
              <button
                onClick={() => saveField(field)}
                className="p-1.5 text-green-500 hover:bg-green-50 rounded"
              >
                <FaSave />
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm flex-1">{profile[field.key] || "—"}</span>
              <button
                onClick={() => startEdit(field)}
                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
              >
                <FaEdit />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const MaterialsUrlEditor = ({ profile, setProfile, addData }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(profile.materials_url || "");

  useEffect(() => {
    setValue(profile.materials_url || "");
  }, [profile.materials_url]);

  const handleSave = async () => {
    try {
      const data = await api.put("/auth/materials-url", {
        materials_url: value || null,
      });
      setProfile((prev) => ({ ...prev, materials_url: data.user.materials_url }));
      addData({ ...profile, materials_url: data.user.materials_url });
      setEditing(false);
      enqueueSnackbar("Materials URL updated!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <FaLink className="text-blue-500" /> Site Links
      </h2>
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
        <FaLink className="text-gray-400 w-5" />
        <span className="text-gray-500 w-28 text-sm">Materials URL</span>
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setEditing(false);
                  setValue(profile.materials_url || "");
                }
              }}
            />
            <button onClick={handleSave} className="p-1.5 text-green-500 hover:bg-green-50 rounded">
              <FaSave />
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setValue(profile.materials_url || "");
              }}
              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm flex-1 truncate">{profile.materials_url || "Not set"}</span>
            <button onClick={() => setEditing(true)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded">
              <FaEdit />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AboutBgImageEditor = () => {
  const [bgImage, setBgImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchBg = async () => {
      try {
        const res = await fetch("/api/settings/about_bg_image");
        const data = await res.json();
        if (data.data?.value) setBgImage(data.data.value);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBg();
  }, []);

  const handleUpload = async (files) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await api.postForm("/auth/about-bg-image", formData);
      setBgImage(data.url);
      enqueueSnackbar("Background image updated!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FaImage className="text-purple-500" /> About Section Background
        </h2>
      </div>
      {bgImage && (
        <img
          src={bgImage}
          alt="About background preview"
          className="w-full h-40 object-cover rounded-lg mb-3 border"
        />
      )}
      <DraggableUpload
        onFilesChange={handleUpload}
        maxFiles={1}
        label="Upload Background Image"
        disabled={uploading}
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
      />
      {uploading && <span className="text-xs text-gray-500 mt-1 block">Uploading...</span>}
    </div>
  );
};

export default Dashboard;
