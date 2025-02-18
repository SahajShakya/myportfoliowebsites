import React, { useState, useEffect } from "react";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import { useDropzone } from "react-dropzone";

const Upload = ({
  name,
  value,
  setFieldValue,
  error,
  touched,
  onFileRemove,
}) => {
  const [files, setFiles] = useState(value || []);

  const onDrop = (acceptedFiles) => {
    const newFiles = [
      ...files,
      ...acceptedFiles.map((file) => ({
        file,
        icon: URL.createObjectURL(file), // Store the object URL in the 'icon' field
        type: "file", // Indicating it's a blob file
      })),
    ];
    setFiles(newFiles);
    setFieldValue(name, newFiles); // Update Formik field
  };

  useEffect(() => {
    if (value && value.length > 0) {
      setFiles(
        value.map((item) => {
          if (item.icon) {
            return { icon: item.icon, type: "url" }; // Mark it as a URL
          }
          return item;
        })
      );
    }
  }, [value]);

  const getFileUrl = (fileObj) => {
    if (fileObj.type === "file") {
      return fileObj.icon; // Blob URL (stored as icon)
    } else if (fileObj.icon) {
      return fileObj.icon; // URL from Supabase stored in icon
    }
    return null;
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*",
    onDrop,
  });

  const removeFile = (index) => {
    const removedFile = files[index];
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setFieldValue(name, updatedFiles);

    // Trigger the file removal handler passed down from the parent
    if (onFileRemove) {
      onFileRemove(removedFile.icon); // Pass the icon (which is the file URL)
    }
  };

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className="flex justify-center items-center border-dashed border-2 p-4 rounded-lg border-gray-400 hover:bg-gray-50 cursor-pointer"
      >
        <input {...getInputProps()} />
        <FaCloudUploadAlt className="text-2xl text-gray-600" />
        <p className="text-sm text-gray-600 ml-2">
          Drag & Drop or Click to Upload
        </p>
      </div>

      {error && touched && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <div className="flex flex-wrap gap-2 mt-4">
        {files.length > 0 &&
          files.map((fileObj, index) => (
            <div key={index} className="relative">
              {fileObj.type === "url" ? (
                <img
                  src={fileObj.icon} // Use 'icon' for URL
                  alt={`Icon ${index}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ) : (
                <img
                  src={getFileUrl(fileObj)}
                  alt={fileObj.file ? fileObj.file.name : `Icon ${index}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}

              <button
                onClick={() => removeFile(index)}
                className="absolute top-0 right-0 bg-gray-700 text-white rounded-full p-1 text-xs"
              >
                <FaTimes />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Upload;
