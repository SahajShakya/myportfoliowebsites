import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { FaFilePdf, FaTimes, FaImage } from "react-icons/fa";

export default function DraggableUpload({
  onFilesChange,
  existingFiles = [],
  onRemoveExisting,
  maxFiles = 10,
  label,
  required = false,
  disabled = false,
  hidePreviews = false,
  accept = { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
  shape = "card",
}) {
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState({});
  const [error, setError] = useState("");
  const pasteRef = useRef(null);

  useEffect(() => {
    const urls = {};
    newFiles.forEach((f) => {
      if (f._previewUrl) urls[f.id] = f._previewUrl;
      else if (f.type?.startsWith("image/")) {
        urls[f.id] = URL.createObjectURL(f);
      }
    });
    setPreviews((prev) => {
      const oldIds = new Set(Object.keys(prev));
      const newIds = new Set(Object.keys(urls));
      oldIds.forEach((id) => {
        if (!newIds.has(id)) URL.revokeObjectURL(prev[id]);
      });
      return urls;
    });
  }, [newFiles]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const addFiles = useCallback(
    (fileList) => {
      setError("");
      const incoming = Array.from(fileList).map((f) =>
        Object.assign(f, {
          id: Math.random().toString(36).slice(2),
        }),
      );
      const combined = [...newFiles, ...incoming].slice(0, maxFiles);
      setNewFiles(combined);
      onFilesChange(combined);
    },
    [newFiles, maxFiles, onFilesChange],
  );

  const removeNew = (id) => {
    const updated = newFiles.filter((f) => f.id !== id);
    setNewFiles(updated);
    onFilesChange(updated);
  };

  const onDrop = useCallback(
    (accepted, rejected) => {
      setError("");
      if (rejected.length > 0) {
        setError(rejected[0].errors[0]?.message || "Invalid file");
        return;
      }
      addFiles(accepted);
    },
    [addFiles],
  );

  useEffect(() => {
    if (disabled) return;
    const handler = (e) => {
      if (newFiles.length + existingFiles.length >= maxFiles) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type?.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            const named = new File(
              [blob],
              `paste-${Date.now()}.${blob.type.split("/")[1]}`,
              { type: blob.type },
            );
            imageFiles.push(named);
          }
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    };
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [newFiles.length, existingFiles.length, maxFiles, addFiles, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: 10 * 1024 * 1024,
    maxFiles: maxFiles - newFiles.length - existingFiles.length,
    disabled: disabled || newFiles.length + existingFiles.length >= maxFiles,
    multiple: maxFiles > 1,
  });

  const isImageFile = (f) => {
    if (f.type) return f.type.startsWith("image/");
    if (typeof f === "string") {
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f);
    }
    return false;
  };

  const isExistingUrl = (f) => typeof f === "string";

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] text-muted/60 uppercase tracking-wide block">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div
        ref={pasteRef}
        tabIndex={0}
        {...getRootProps()}
        className={`border-2 border-dashed p-3 transition text-center outline-none ${
          shape === "circle"
            ? "rounded-full w-24 h-24 flex flex-col items-center justify-center mx-auto"
            : "rounded-xl"
        } ${
          disabled
            ? "cursor-not-allowed opacity-30"
            : "cursor-pointer"
        } ${
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${
          newFiles.length + existingFiles.length >= maxFiles
            ? "opacity-40 cursor-not-allowed"
            : ""
        }`}
      >
        <input {...getInputProps()} />
        <div className={`flex flex-col items-center gap-1 ${shape === "circle" ? "text-center" : ""}`}>
          <FaImage className="text-gray-400 text-lg" />
          {shape !== "circle" && (
            <p className="text-xs text-gray-500">
              {disabled
                ? "Select category first"
                : isDragActive
                  ? "Drop here"
                  : newFiles.length + existingFiles.length >= maxFiles
                    ? `Max ${maxFiles} file(s)`
                    : "Drag & drop, click, or Ctrl+V to paste"}
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!hidePreviews && (existingFiles.length > 0 || newFiles.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {existingFiles.map((f, idx) => {
            const url = isExistingUrl(f) ? f : f.url || f.preview || "";
            const name = isExistingUrl(f)
              ? f.split("/").pop()
              : f.name || f.original_name || "file";
            return (
              <PreviewCard
                key={`existing-${idx}`}
                url={url}
                name={name}
                isImage={isExistingUrl(f) ? isImageFile(f) : isImageFile(f.type || f)}
                onRemove={() => onRemoveExisting?.(f, idx)}
                badge="Existing"
                shape={shape}
              />
            );
          })}

          {newFiles.map((f) => (
            <PreviewCard
              key={f.id}
              url={previews[f.id]}
              name={f.name}
              isImage={isImageFile(f)}
              onRemove={() => removeNew(f.id)}
              badge="New"
              shape={shape}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewCard({ url, name, isImage, onRemove, badge, shape = "card" }) {
  const sizeClasses = {
    circle: "w-20 h-20 rounded-full",
    rect: "w-32 h-20 rounded-lg",
    card: "w-24 h-24 rounded-xl",
  };

  const size = sizeClasses[shape] || sizeClasses.card;

  return (
    <div className="relative group">
      {isImage && url ? (
        <img
          src={url}
          alt={name}
          className={`${size} object-cover border border-gray-200`}
        />
      ) : (
        <div className={`${size} border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 p-2`}>
          <FaFilePdf className="text-red-400 text-2xl" />
          <span className="text-[9px] text-gray-500 text-center leading-tight break-all line-clamp-2">
            {name}
          </span>
        </div>
      )}

      {badge && (
        <span className="absolute top-1 left-1 text-[8px] bg-black/60 text-white px-1 py-0.5 rounded">
          {badge}
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
      >
        <FaTimes size={8} />
      </button>
    </div>
  );
}
