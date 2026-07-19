import React from "react";
import { FaVideo } from "react-icons/fa";

const isVideoUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
};

const MediaRenderer = ({ src, alt, className, rounded, controls = false, ...props }) => {
  if (!src) return null;

  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        controls={controls}
        muted
        playsInline
        preload="metadata"
        {...props}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      className={className}
      loading="lazy"
      {...props}
    />
  );
};

export default MediaRenderer;
export { isVideoUrl };
