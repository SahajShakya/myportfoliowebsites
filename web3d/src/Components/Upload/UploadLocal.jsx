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

  // Handle file drop (local upload)
  const onDrop = (acceptedFiles) => {
    const newFiles = [
      ...files,
      ...acceptedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file), // Create URL for the uploaded file
      })),
    ];
    setFiles(newFiles);
    setFieldValue(name, newFiles); // Update Formik's field value with the new files
  };

  // Handle the URLs or file objects display
  useEffect(() => {
    if (value && value.length > 0) {
      // Assuming `value` contains an array of file objects or URLs from the backend
      setFiles(value);
    }
  }, [value]);

  const getFileUrl = (fileObj) => {
    return fileObj.url || URL.createObjectURL(fileObj.file); // Use URL directly or create one
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*", // Only accept image files
    onDrop,
  });

  // Remove a file from the list
  const removeFile = (index) => {
    const removedFile = files[index];
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setFieldValue(name, updatedFiles); // Update Formik's field value

    let removedFileUrl = removedFile.url;

    // Call the parent callback to inform about the removal with the correct URL
    if (onFileRemove) {
      onFileRemove(removedFileUrl); // Send the correct URL back to the parent
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
              <img
                src={getFileUrl(fileObj)} // Use the URL directly or created from the file
                alt={fileObj.file ? fileObj.file.name : `Icon ${index}`}
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
