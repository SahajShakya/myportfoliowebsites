// MyEditor.js
import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import the Quill theme CSS

const MyEditor = ({ value, onChange }) => {
  return (
    <div className="mb-6">
      <label className="block text-sm text-gray-700">Points</label>
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={{
          toolbar: [
            [{ header: "1" }, { header: "2" }, { font: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["bold", "italic", "underline"],
            ["link"],
            ["blockquote"],
            [{ color: [] }, { background: [] }],
            [{ script: "sub" }, { script: "super" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ direction: "rtl" }],
            ["clean"],
          ],
        }}
      />
    </div>
  );
};

export default MyEditor;
