/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import { privateAgent } from "../api/authRequest";
import { routesName } from "../constants/routesName";
import DraggableUpload from "./Upload/DraggableUpload";
import { FaImage } from "react-icons/fa";

const SectionBgImageEditor = ({ sectionKey, title }) => {
  const [bgImage, setBgImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchBg = async () => {
      try {
        const response = await privateAgent.get(
          routesName.SettingsRoute().sectionBgImage(sectionKey)
        );
        const data = response.data;
        if (data.data?.value) setBgImage(data.data.value);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBg();
  }, [sectionKey]);

  const handleUpload = async (files) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await privateAgent.post(
        routesName.AuthRoute({}).sectionBgImage(sectionKey),
        formData
      );
      const data = response.data;
      setBgImage(data.url);
      enqueueSnackbar(`${title} background updated!`, { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveExisting = async () => {
    try {
      await privateAgent.delete(
        routesName.AuthRoute().deleteSectionBgImage(sectionKey)
      );
      setBgImage(null);
      enqueueSnackbar(`${title} background removed`, { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: "error" });
    }
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <FaImage className="text-purple-500" />
        <h3 className="text-sm font-semibold">{title} Background</h3>
      </div>
      <DraggableUpload
        onFilesChange={handleUpload}
        existingFiles={bgImage ? [bgImage] : []}
        onRemoveExisting={handleRemoveExisting}
        maxFiles={1}
        label="Upload Background"
        disabled={uploading}
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
      />
      {uploading && <span className="block mt-1 text-xs text-gray-500">Uploading...</span>}
    </div>
  );
};

export default SectionBgImageEditor;
