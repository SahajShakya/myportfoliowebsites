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
  deferDelete = false,
  onFileRemoved,
}) => {
  const existingFiles = (value || [])
    .filter((item) => !item.file)
    .map((item) => {
      if (item.icon) return item.icon;
      if (item.url) return item.url;
      return null;
    })
    .filter(Boolean);

  const controlledNewFiles = (value || [])
    .filter((item) => item.file)
    .map((item) => item.file);

  const handleChange = (newDraggableFiles) => {
    const existingItems = (value || []).filter((item) => !item.file);
    const formikFiles = newDraggableFiles.map((f) => ({
      file: f,
      icon: URL.createObjectURL(f),
      type: "file",
    }));
    setFieldValue(name, [...existingItems, ...formikFiles]);
  };

  const handleRemoveExisting = (url) => {
    const removedItem = (value || []).find((item) => {
      if (item.file) return false;
      const itemUrl = item.icon || item.url;
      return itemUrl === url;
    });

    if (deferDelete) {
      if (onFileRemoved && removedItem) {
        onFileRemoved(removedItem);
      }
    } else {
      if (onFileRemove) {
        onFileRemove(removedItem || url);
      }
    }

    const updated = (value || []).filter((item) => {
      if (item.file) return true;
      const itemUrl = item.icon || item.url;
      return itemUrl !== url;
    });
    setFieldValue(name, updated);
  };

  return (
    <div className="space-y-2">
      <DraggableUpload
        onFilesChange={handleChange}
        value={controlledNewFiles}
        existingFiles={existingFiles}
        onRemoveExisting={handleRemoveExisting}
        maxFiles={maxFiles}
        accept={{ "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"], "video/*": [".mp4", ".webm", ".mov", ".avi"] }}
      />
      {error && touched && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Upload;
