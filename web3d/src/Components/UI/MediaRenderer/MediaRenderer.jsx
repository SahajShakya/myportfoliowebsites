import React from "react";
import { FaVideo } from "react-icons/fa";
import { imageUrl } from "../../../utils/imageUrl";

const isVideoUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  return /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
};

const MediaRenderer = ({ src, alt, className, rounded, controls = false, ...props }) => {
  if (!src) return null;

  const resolvedSrc = imageUrl(src);

  if (isVideoUrl(resolvedSrc)) {
    return (
      <video
        src={resolvedSrc}
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
      src={resolvedSrc}
      alt={alt || ""}
      className={className}
      loading="lazy"
      {...props}
    />
  );
};

export default MediaRenderer;
export { isVideoUrl };
