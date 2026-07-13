import React, { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import api from "../../../api/client";
import { useAuthContext } from "../../../context/AuthContext";
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from "react-icons/fa";

const ICON_OPTIONS = [
  { label: "GitHub", value: "FaGithub" },
  { label: "LinkedIn", value: "FaLinkedin" },
  { label: "YouTube", value: "FaYoutube" },
  { label: "Instagram", value: "FaInstagram" },
  { label: "Twitter / X", value: "FaXTwitter" },
  { label: "Facebook", value: "FaFacebook" },
  { label: "Envelope / Email", value: "FaEnvelope" },
  { label: "Globe / Website", value: "FaGlobe" },
  { label: "Phone", value: "FaPhone" },
  { label: "ResearchGate", value: "FaResearchgate" },
  { label: "Google Scholar", value: "FaGraduationCap" },
  { label: "Reddit", value: "FaReddit" },
  { label: "Discord", value: "FaDiscord" },
  { label: "Twitch", value: "FaTwitch" },
  { label: "Medium", value: "FaMedium" },
  { label: "Dribbble", value: "FaDribbble" },
  { label: "CodePen", value: "FaCodepen" },
];

const emptyLink = { platform: "", icon_name: "", url: "", display_order: 0 };

const SocialLinks = () => {
  const { user } = useAuthContext();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ ...emptyLink });
  const [adding, setAdding] = useState(false);

  const fetchLinks = async () => {
    try {
      const data = await api.get(`/auth/social-links/${user?.id || ""}`);
      setLinks(data.data || []);
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [user?.id]);

  const handleAdd = async () => {
    if (!editForm.platform || !editForm.url) {
      enqueueSnackbar("Platform and URL are required", { variant: "error" });
      return;
    }
    try {
      const data = await api.post("/auth/social-links", editForm);
      setLinks([...links, data.data]);
      setAdding(false);
      setEditForm({ ...emptyLink });
      enqueueSnackbar("Link added!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  };

  const handleUpdate = async (id) => {
    if (!editForm.platform || !editForm.url) {
      enqueueSnackbar("Platform and URL are required", { variant: "error" });
      return;
    }
    try {
      const data = await api.put(`/auth/social-links/${id}`, editForm);
      setLinks(links.map((l) => (l.id === id ? data.data : l)));
      setEditingId(null);
      setEditForm({ ...emptyLink });
      enqueueSnackbar("Link updated!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this link?")) return;
    try {
      await api.delete(`/auth/social-links/${id}`);
      setLinks(links.filter((l) => l.id !== id));
      enqueueSnackbar("Link deleted!", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  };

  const startEdit = (link) => {
    setEditingId(link.id);
    setAdding(false);
    setEditForm({
      platform: link.platform,
      icon_name: link.icon_name,
      url: link.url,
      display_order: link.display_order,
    });
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setEditForm({ ...emptyLink });
  };

  const cancelAll = () => {
    setEditingId(null);
    setAdding(false);
    setEditForm({ ...emptyLink });
  };

  const FormRow = ({ onSave, onCancel }) => (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
      <select
        value={editForm.icon_name}
        onChange={(e) => {
          const opt = ICON_OPTIONS.find((o) => o.value === e.target.value);
          setEditForm({
            ...editForm,
            icon_name: e.target.value,
            platform: opt ? opt.label : editForm.platform,
          });
        }}
        className="px-3 py-2 border rounded-lg text-sm"
      >
        <option value="">Select Icon</option>
        {ICON_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Platform name"
        value={editForm.platform}
        onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
        className="px-3 py-2 border rounded-lg text-sm"
      />
      <input
        type="url"
        placeholder="URL"
        value={editForm.url}
        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
        className="px-3 py-2 border rounded-lg text-sm"
      />
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Order"
          value={editForm.display_order}
          onChange={(e) =>
            setEditForm({ ...editForm, display_order: parseInt(e.target.value) || 0 })
          }
          className="px-3 py-2 border rounded-lg text-sm w-20"
        />
        <button onClick={onSave} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <FaSave />
        </button>
        <button onClick={onCancel} className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500">
          <FaTimes />
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Social Links</h1>
        {!adding && !editingId && (
          <button
            onClick={startAdd}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <FaPlus /> Add Link
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4">
          <FormRow onSave={handleAdd} onCancel={cancelAll} />
        </div>
      )}

      <div className="space-y-3">
        {links.map((link) => (
          <div key={link.id}>
            {editingId === link.id ? (
              <FormRow onSave={() => handleUpdate(link.id)} onCancel={cancelAll} />
            ) : (
              <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-mono text-gray-500 w-32">{link.icon_name}</span>
                  <div>
                    <div className="font-semibold">{link.platform}</div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      {link.url}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">#{link.display_order}</span>
                  <button
                    onClick={() => startEdit(link)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {links.length === 0 && !adding && (
        <p className="text-center text-gray-500 py-8">No social links yet. Add one!</p>
      )}
    </div>
  );
};

export default SocialLinks;
