/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { ErrorMessage } from "formik";

const TOOLBAR_OPTIONS = [
  [{ header: "1" }, { header: "2" }, { font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline", "strike"],
  [{ align: [] }],
  ["link"],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  ["blockquote"],
  [{ color: [] }, { background: [] }],
];

const MyEditor = ({ value, onChange, name, error }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const ignoreChange = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

    const quill = new Quill(editorRef.current, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    if (value) {
      quill.root.innerHTML = value;
    }

    quill.on("text-change", () => {
      if (ignoreChange.current) return;
      const html = quill.root.innerHTML;
      const content = html === "<p><br></p>" ? "" : html;
      onChangeRef.current?.(content);
    });

    quillRef.current = quill;

    return () => {
      quillRef.current = null;
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const currentHtml = quill.root.innerHTML;
    const newHtml = value || "";
    if (currentHtml !== newHtml) {
      ignoreChange.current = true;
      const sel = quill.getSelection();
      quill.root.innerHTML = newHtml;
      if (sel) quill.setSelection(sel);
      ignoreChange.current = false;
    }
  }, [value]);

  return (
    <div className="mb-6">
      <div ref={editorRef} />
      {error && (
        <ErrorMessage
          name={name}
          component="div"
          className="mt-2 text-xs text-red-500"
        />
      )}
    </div>
  );
};

export default MyEditor;
