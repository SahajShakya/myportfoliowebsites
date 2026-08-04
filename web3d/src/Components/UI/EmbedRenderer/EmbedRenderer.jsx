import React from "react";

function getEmbedInfo(url) {
  if (!url || typeof url !== "string") return null;

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    };
  }

  const facebookMatch = url.match(
    /facebook\.com\/(?:.*?\/videos\/(\d+)|watch\?v=(\d+)|.*?\/video\/(\d+))/
  );
  if (facebookMatch) {
    const videoId = facebookMatch[1] || facebookMatch[2] || facebookMatch[3];
    return {
      type: "facebook",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`,
    };
  }

  const tiktokMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (tiktokMatch) {
    return {
      type: "tiktok",
      embedUrl: null,
      tiktokUrl: url,
      videoId: tiktokMatch[1],
    };
  }

  return null;
}

function detectPlatform(url) {
  if (!url) return "";
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/facebook\.com/.test(url)) return "facebook";
  if (/tiktok\.com/.test(url)) return "tiktok";
  return "";
}

export default function EmbedRenderer({ url, title, className = "" }) {
  const info = getEmbedInfo(url);

  if (!info) {
    return (
      <div className={`rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400 ${className}`}>
        Invalid or unsupported video URL
      </div>
    );
  }

  if (info.type === "tiktok") {
    return (
      <div className={`rounded-xl overflow-hidden ${className}`}>
        <blockquote
          className="tiktok-embed"
          cite={info.tiktokUrl}
          data-video-id={info.videoId}
          style={{ maxWidth: "605px", minWidth: "325px" }}
        >
          <section>
            <a href={info.tiktokUrl} target="_blank" rel="noopener noreferrer">
              {title || "TikTok Video"}
            </a>
          </section>
        </blockquote>
        <script async src="https://www.tiktok.com/embed.js"></script>
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <iframe
        src={info.embedUrl}
        title={title || `${info.type} video`}
        className="w-full aspect-video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export { getEmbedInfo, detectPlatform };
