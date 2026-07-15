import React from "react";
import DraggableUpload from "./DraggableUpload";

const Upload = ({
  name,
  value,
  setFieldValue,
  error,
  touched,
  onFileRemove,
  maxFiles = 1,
}) => {
  const existingFiles = (value || [])
    .map((item) => {
      if (item.icon) return item.icon;
      if (item.url) return item.url;
      return null;
    })
    .filter(Boolean);

  const handleChange = (newDraggableFiles) => {
    const formikFiles = newDraggableFiles.map((f) => ({
      file: f,
      icon: URL.createObjectURL(f),
      type: "file",
    }));
    setFieldValue(name, formikFiles);
  };

  const handleRemoveExisting = (url, idx) => {
    if (onFileRemove) {
      onFileRemove(url);
    }
    const updated = (value || []).filter((_, i) => i !== idx);
    setFieldValue(name, updated);
  };

  return (
    <div className="space-y-2">
      <DraggableUpload
        onFilesChange={handleChange}
        existingFiles={existingFiles}
        onRemoveExisting={handleRemoveExisting}
        maxFiles={maxFiles}
        accept={{ "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] }}
      />
      {error && touched && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Upload;
