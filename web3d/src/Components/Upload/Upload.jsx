// Upload.js
import React, { useState } from "react";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import { useDropzone } from "react-dropzone";

const Upload = ({ name, value, setFieldValue, error, touched }) => {
  const [files, setFiles] = useState(value || []);

  const onDrop = (acceptedFiles) => {
    const newFiles = [...files, ...acceptedFiles];
    setFiles(newFiles);
    setFieldValue(name, newFiles); // Update Formik's field value with the new files
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setFieldValue(name, updatedFiles); // Update Formik's field value
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*", // Only accept image files
    onDrop,
  });

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
        {files.map((file, index) => (
          <div key={index} className="relative">
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
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
