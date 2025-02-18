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

  console.log("Files state:", files);

  // Function to convert URL to File
  const urlToFile = async (url, filename = "image.jpg") => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch the image");
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type });
      return { url, file }; // Return both the URL and File object
    } catch (err) {
      console.error("Error converting URL to file:", err);
      return null; // Return null if error occurs
    }
  };

  // Handle file drop
  const onDrop = (acceptedFiles) => {
    const newFiles = [
      ...files,
      ...acceptedFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    ];
    setFiles(newFiles);
    setFieldValue(name, newFiles); // Update Formik's field value with the new files
  };

  const getFileUrl = (fileObj) => {
    if (fileObj.file) {
      return fileObj.url; // Return the URL created from the File object
    }
    return fileObj.url; // For URLs, return the URL itself
  };

  // Remove a file from the list
  const removeFile = (index) => {
    const removedFile = files[index];
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setFieldValue(name, updatedFiles); // Update Formik's field value

    let removedFileUrl = "";

    // Check if the removed file contains both 'url' and 'file'
    if (removedFile.url) {
      removedFileUrl = removedFile.url; // If it's a URL, return the URL
    } else if (removedFile.file) {
      // If it's a File object, use the original URL stored in 'file'
      removedFileUrl = removedFile.file.name; // Placeholder for name, but you might need to track URL separately
    }

    // Call the parent callback to inform about the removal with the correct URL
    if (onFileRemove) {
      onFileRemove(removedFileUrl); // Send the correct URL back to the parent
    }
  };

  // Handle the URLs or file object display
  useEffect(() => {
    const handleUrls = async () => {
      if (value && value.length > 0) {
        // Check if the value contains objects with 'icon' field (assuming 'value' contains URLs)
        if (typeof value[0] === "object" && value[0].hasOwnProperty("icon")) {
          console.log("URLs detected in value: ", value);
          // Extract the URL from the 'icon' field for each object
          const urlFiles = await Promise.all(
            value.map(async (fileObj) => {
              const { url, file } = await urlToFile(fileObj.icon);
              return { url, file }; // Return both URL and File object
            })
          );
          // Filter out any failed URL-to-File conversions (i.e., null)
          setFiles(urlFiles.filter(({ file }) => file !== null));
        }
      }
    };
    handleUrls();
  }, [value]);

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
        {files.length > 0 &&
          files.map((fileObj, index) => (
            <div key={index} className="relative">
              {/* Display either File object or URL */}
              <img
                src={getFileUrl(fileObj)} // Use file URL or object URL based on the type
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
