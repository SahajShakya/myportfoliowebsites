import React, { useState, useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { ErrorMessage } from "formik";

const MyEditor = ({ value, onChange, name, error }) => {
  const [isMounted, setIsMounted] = useState(false);
  const quillRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Don't render until after the first mount
  }

  return (
    <div className="mb-6">
      <label className="block text-lg font-medium text-gray-700">Content</label>
      <ReactQuill
        ref={quillRef}
        value={value || ""}
        onChange={onChange}
        modules={{
          toolbar: [
            [{ header: "1" }, { header: "2" }, { font: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["bold", "italic", "underline", "strike"],
            [{ align: [] }],
            ["link"],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ direction: "rtl" }],
            ["blockquote"],
            [{ color: [] }, { background: [] }],
          ],
        }}
        formats={[
          "header",
          "font",
          "list",
          "bold",
          "italic",
          "underline",
          "strike",
          "align",
          "link",
          "indent",
          "direction",
          "blockquote",
          "color",
          "background",
        ]}
        className="react-quill-editor"
      />
      {/* Error Message */}
      {error && (
        <ErrorMessage
          name={name}
          component="div"
          className="text-red-500 text-xs mt-2"
        />
      )}
    </div>
  );
};

export default MyEditor;
