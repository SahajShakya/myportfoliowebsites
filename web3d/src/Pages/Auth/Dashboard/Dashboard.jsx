/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import { useUser } from "../../../context/UserContext";
import { useAuthContext } from "../../../context/AuthContext";
import { privateAgent } from "../../../api/authRequest";
import { routesName } from "../../../constants/routesName";
import DraggableUpload from "../../../Components/Upload/DraggableUpload";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaFilePdf,
  FaCheckCircle,
  FaEdit,
  FaImage,
  FaSave,
  FaTimes,
  FaLink,
  FaBrain,
  FaSpinner,
} from "react-icons/fa";
import { useCvsQuery } from "../../../Hooks/options/useCvsQuery";
import { useProfileImageQuery } from "../../../Hooks/options/useSettingsQuery";
import { useUploadProfileImage, useUpdateProfile, useUpdateMaterialsUrl } from "../../../Hooks/mutations/useAuthMutations";
import { useUploadCv, useDeleteCv, useUpdateCv } from "../../../Hooks/mutations/useCvsMutations";
import SectionBgImageEditor from "../../../Components/SectionBgImageEditor";
import { deleteFile } from "../../../api/upload";

const Dashboard = () => {
  const { user: authUser } = useAuthContext();
  const { user, addData } = useUser();
  const [profile, setProfile] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [training, setTraining] = useState(false);

  const { data: cvsData, refetch: refetchCvs } = useCvsQuery();
  const cvs = cvsData || [];

  const { data: profileImageData } = useProfileImageQuery();

  const uploadProfileImageMutation = useUploadProfileImage();
  const updateProfileMutation = useUpdateProfile();
  const updateMaterialsUrlMutation = useUpdateMaterialsUrl();
  const uploadCvMutation = useUploadCv();
  const deleteCvMutation = useDeleteCv();
  const updateCvMutation = useUpdateCv();

  const fetchProfile = async () => {
    try {
      const response = await privateAgent.get(routesName.AuthRoute({}).me);
      const data = response.data;
      if (data.user) {
        setProfile(data.user);
        addData({ ...user, ...data.user });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (authUser?.id) {
      fetchProfile();
    }
  }, [authUser?.id]);

  const handleImageUpload = async (files) => {
    const file = files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    uploadProfileImageMutation.mutate(formData, {
      onSuccess: (response) => {
        const data = response.data;
        setProfile((prev) => ({ ...prev, profile_image: data.url }));
        updateProfileMutation.mutate({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || null,
          bio: profile.bio || null,
          tagline: profile.tagline || null,
          profile_image: data.url,
        }, {
          onSuccess: (res) => {
            const updatedUser = res.data.user;
            setProfile((prev) => ({ ...prev, ...updatedUser }));
            addData({ ...user, ...updatedUser });
            enqueueSnackbar("Profile image updated!", { variant: "success" });
          },
          onError: (err) => {
            enqueueSnackbar("Image uploaded but failed to save: " + err.message, { variant: "warning" });
          },
        });
      },
      onError: (err) => {
        enqueueSnackbar(err.message, { variant: "error" });
      },
    });
  };

  const handleImageRemove = async () => {
    const currentImage = profileImageData?.value || profile.profile_image;
    if (!currentImage) return;
    try {
      await deleteFile(currentImage);
      setProfile((prev) => ({ ...prev, profile_image: null }));
      updateProfileMutation.mutate({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || null,
        bio: profile.bio || null,
        tagline: profile.tagline || null,
        profile_image: null,
      }, {
        onSuccess: (res) => {
          const updatedUser = res.data.user;
          setProfile((prev) => ({ ...prev, ...updatedUser }));
          addData({ ...user, ...updatedUser });
          enqueueSnackbar("Profile image removed!", { variant: "success" });
        },
        onError: (err) => {
          enqueueSnackbar("Failed to remove profile image: " + err.message, { variant: "error" });
        },
      });
    } catch (err) {
      enqueueSnackbar("Failed to remove profile image: " + err.message, { variant: "error" });
    }
  };

  const handleCvUpload = async (files) => {
    const file = files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^.]+$/, ""));
    formData.append("is_active", "true");
    uploadCvMutation.mutate(formData, {
      onSuccess: () => {
        refetchCvs();
        enqueueSnackbar("CV uploaded!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message, { variant: "error" });
      },
    });
  };

  const handleCvDelete = async (id) => {
    if (!confirm("Delete this CV?")) return;
    deleteCvMutation.mutate(id, {
      onSuccess: () => {
        refetchCvs();
        enqueueSnackbar("CV deleted!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message, { variant: "error" });
      },
    });
  };

  const handleCvSetActive = async (id) => {
    updateCvMutation.mutate({ id, payload: { is_active: true } }, {
      onSuccess: () => {
        refetchCvs();
        enqueueSnackbar("Active CV set!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message, { variant: "error" });
      },
    });
  };

  const handleTrainKnowledgeBase = async () => {
    setTraining(true);
    try {
      const response = await privateAgent.post(routesName.KnowledgeRoute().rebuild);
      enqueueSnackbar(`Knowledge base trained on ${response.data.chunks} chunks!`, { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Failed to train knowledge base: " + (err.response?.data?.error || err.message), { variant: "error" });
    } finally {
      setTraining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="mt-10 text-3xl font-bold">Admin Dashboard</h1>

      {/* Profile Card */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <div className="flex items-center gap-6 mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <p className="text-gray-500">{profile.email}</p>
            {profile.phone && (
              <p className="text-sm text-gray-400">{profile.phone}</p>
            )}
            <div className="mt-2">
              <DraggableUpload
                onFilesChange={handleImageUpload}
                existingFiles={(profileImageData?.value || profile.profile_image) ? [profileImageData?.value || profile.profile_image] : []}
                onRemoveExisting={handleImageRemove}
                maxFiles={1}
                label="Profile Image"
                disabled={uploadProfileImageMutation.isPending}
                shape="circle"
              />
              {uploadProfileImageMutation.isPending && <span className="text-xs text-gray-500">Uploading...</span>}
            </div>
          </div>
        </div>

        <InlineProfileEditor
          profile={profile}
          setProfile={setProfile}
          editingField={editingField}
          setEditingField={setEditingField}
          addData={addData}
          updateProfileMutation={updateProfileMutation}
        />
      </div>

      {/* CV Management */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <FaFilePdf className="text-red-500" /> CV / Resume
          </h2>
        </div>

        {cvs.length > 0 && (
          <div className="mb-4 space-y-2">
            {cvs.map((cv) => (
              <div key={cv.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <FaFilePdf className="flex-shrink-0 text-lg text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cv.title}</p>
                  <a
                    href={cv.relative_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-500 truncate hover:underline"
                  >
                    {cv.relative_path?.split('/').pop()}
                  </a>
                </div>
                <div className="flex items-center flex-shrink-0 gap-1">
                  <button
                    onClick={() => handleCvSetActive(cv.id)}
                    className="px-2 py-1 text-xs text-blue-500 rounded hover:text-blue-700 hover:bg-blue-50"
                  >
                    {cv.relative_path?.split('/').pop()}
                  </button>
                  <button
                    onClick={() => handleCvDelete(cv.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DraggableUpload
          onFilesChange={handleCvUpload}
          maxFiles={1}
          label="Upload new CV"
          disabled={uploadCvMutation.isPending}
          accept={{
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
          }}
        />
        {uploadCvMutation.isPending && <span className="block mt-1 text-xs text-gray-500">Uploading...</span>}
      </div>

      {/* Materials URL */}
      <MaterialsUrlEditor profile={profile} setProfile={setProfile} addData={addData} updateMaterialsUrlMutation={updateMaterialsUrlMutation} />

      {/* Section Background Images */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <FaImage className="text-purple-500" />
          <h2 className="text-xl font-semibold">Section Backgrounds</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SectionBgImageEditor sectionKey="about_bg_image" title="About" />
          <SectionBgImageEditor sectionKey="academics_bg_image" title="Academics" />
          <SectionBgImageEditor sectionKey="achievements_bg_image" title="Achievements" />
          <SectionBgImageEditor sectionKey="journey_bg_image" title="Journey" />
          <SectionBgImageEditor sectionKey="projects_bg_image" title="Projects" />
          <SectionBgImageEditor sectionKey="testimonials_bg_image" title="Testimonials" />
          <SectionBgImageEditor sectionKey="contact_bg_image" title="Contact" />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/auth/profile"
          className="flex items-center gap-3 p-5 transition bg-white shadow-md rounded-xl hover:shadow-lg"
        >
          <FaUser className="text-xl text-blue-500" />
          <div>
            <div className="font-medium">Profile Settings</div>
            <div className="text-xs text-gray-400">Edit name, bio, tagline</div>
          </div>
        </Link>
        <Link
          to="/auth/social-links"
          className="flex items-center gap-3 p-5 transition bg-white shadow-md rounded-xl hover:shadow-lg"
        >
          <FaEdit className="text-xl text-purple-500" />
          <div>
            <div className="font-medium">Social Links</div>
            <div className="text-xs text-gray-400">GitHub, LinkedIn, etc.</div>
          </div>
        </Link>
        <Link
          to="/auth/password"
          className="flex items-center gap-3 p-5 transition bg-white shadow-md rounded-xl hover:shadow-lg"
        >
          <FaCheckCircle className="text-xl text-green-500" />
          <div>
            <div className="font-medium">Change Password</div>
            <div className="text-xs text-gray-400">Update credentials</div>
          </div>
        </Link>
      </div>

      {/* Chat Agent Training */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <FaBrain className="text-indigo-500" />
          <h2 className="text-xl font-semibold">Chat Agent</h2>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Retrain the AI chat agent on the latest projects, academics, journey, and achievements data.
        </p>
        <button
          onClick={handleTrainKnowledgeBase}
          disabled={training}
          className="inline-flex items-center gap-2 px-4 py-2 text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {training ? <FaSpinner className="animate-spin" /> : <FaBrain />}
          {training ? "Training..." : "Train Knowledge Base"}
        </button>
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
  updateProfileMutation,
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
    const payload = {
      name: profile.name || "",
      email: profile.email || "",
      phone: profile.phone || null,
      bio: profile.bio || null,
      tagline: profile.tagline || null,
      profile_image: profile.profile_image || null,
    };
    payload[field.key] = editValue || null;

    updateProfileMutation.mutate(payload, {
      onSuccess: (response) => {
        const data = response.data;
        setProfile((prev) => ({ ...prev, [field.key]: editValue }));
        addData({
          ...profile,
          name: data.user.name,
          email: data.user.email,
        });
        setEditingField(null);
        enqueueSnackbar(`${field.label} updated!`, { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message, { variant: "error" });
      },
    });
  };

  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div
          key={field.key}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
        >
          <field.icon className="w-5 text-gray-400" />
          <span className="w-16 text-sm text-gray-500">{field.label}</span>
          {editingField === field.key ? (
            <div className="flex items-center flex-1 gap-2">
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
            <div className="flex items-center flex-1 gap-2">
              <span className="flex-1 text-sm">{profile[field.key] || "—"}</span>
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

const MaterialsUrlEditor = ({ profile, setProfile, addData, updateMaterialsUrlMutation }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(profile.materials_url || "");

  useEffect(() => {
    setValue(profile.materials_url || "");
  }, [profile.materials_url]);

  const handleSave = async () => {
    updateMaterialsUrlMutation.mutate({ materials_url: value || null }, {
      onSuccess: (response) => {
        const data = response.data;
        setProfile((prev) => ({ ...prev, materials_url: data.user.materials_url }));
        addData({ ...profile, materials_url: data.user.materials_url });
        setEditing(false);
        enqueueSnackbar("Materials URL updated!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message, { variant: "error" });
      },
    });
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-xl">
      <h2 className="flex items-center gap-2 mb-4 text-xl font-semibold">
        <FaLink className="text-blue-500" /> Site Links
      </h2>
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
        <FaLink className="w-5 text-gray-400" />
        <span className="text-sm text-gray-500 w-28">Materials URL</span>
        {editing ? (
          <div className="flex items-center flex-1 gap-2">
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
          <div className="flex items-center flex-1 gap-2">
            <span className="flex-1 text-sm truncate">{profile.materials_url || "Not set"}</span>
            <button onClick={() => setEditing(true)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded">
              <FaEdit />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;