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

  // Handle file drop (local image upload)
  const onDrop = (acceptedFiles) => {
    const newFiles = [
      ...files,
      ...acceptedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file), // Create URL for the uploaded file
        type: "file", // Indicate it's a file
      })),
    ];
    setFiles(newFiles);
    setFieldValue(name, newFiles); // Update Formik's field value with the new files
  };

  // Handle the URLs or file objects display (when loading data from the backend)
  useEffect(() => {
    if (value && value.length > 0) {
      setFiles(
        value.map((item) => {
          if (item.url) {
            // If it's a URL, ensure it's marked as a URL type
            return { url: item.url, type: "url" };
          }
          return item;
        })
      );
    }
  }, [value]);

  const getFileUrl = (fileObj) => {
    // Return the correct URL for the file (either from file object or URL)
    return fileObj.icon || URL.createObjectURL(fileObj.icon);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: "image/*", // Only accept image files
    onDrop,
  });

  // Remove a file or URL from the list
  const removeFile = (index) => {
    const removedFile = files[index]; // Get the removed file object

    let removedFileUrl = null;

    // Ensure the removed file exists and check if it's a URL from the backend
    if (removedFile && removedFile.icon) {
      removedFileUrl = removedFile.icon; // Assign URL from the backend
    } else if (removedFile && removedFile.file) {
      // It's a Blob file, no URL needed
      removedFileUrl = null;
    }

    // Remove the file from the state (files array)
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setFieldValue(name, updatedFiles); // Update Formik field value with the new files

    // Call the parent callback to inform about the removal with the correct URL (or null)
    if (onFileRemove) {
      onFileRemove(removedFileUrl); // Pass URL (or null) to the parent
    }

    // Check if we have a valid URL before calling deleteFileByUrl
    // if (removedFileUrl) {
    //   handleFileRemove(removedFileUrl); // Only attempt to delete if URL is valid
    // }
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
                // Display URL as image
                <img
                  src={fileObj.url}
                  alt={`Icon ${index}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ) : (
                // Display uploaded file
                <img
                  src={getFileUrl(fileObj)} // Use the file URL or the object URL
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
