/* eslint-disable react/prop-types */
import { motion } from "framer-motion";
import EmbedRenderer from "../EmbedRenderer/EmbedRenderer";
import ImageGrid from "../ImageGrid/ImageGrid";
import ImageCarousel from "../ImageCarousel/ImageCarousel";

const ContentSection = ({ section, index }) => {
  let images = [];
  if (section.image_url) {
    try {
      const parsed = JSON.parse(section.image_url);
      if (Array.isArray(parsed)) {
        images = parsed.filter((img) => {
          const url = typeof img === "string" ? img : img.url || "";
          return url.length > 0;
        });
      }
    } catch {
      const url = section.image_url;
      if (url && url.length > 0) {
        images = [{ url, title: section.image_description || "" }];
      }
    }
  }

  let embeds = [];
  if (section.embed_urls) {
    try {
      const parsed = typeof section.embed_urls === "string" ? JSON.parse(section.embed_urls) : section.embed_urls;
      if (Array.isArray(parsed)) {
        embeds = parsed.filter((e) => e && e.url);
      }
    } catch {
      // ignore parse errors
    }
  }

  const hasMultipleImages = images.length > 1;
  const hasImages = images.length > 0;
  const hasEmbeds = embeds.length > 0;
  const hasText = !!(section.heading || section.content_text);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative flex gap-6 sm:gap-8"
    >
      {/* Timeline dot + line */}
      <div className="relative flex flex-col items-center flex-shrink-0">
        <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
          <span className="text-xs font-bold text-white">{index + 1}</span>
        </div>
        <div className="w-px flex-1 bg-gradient-to-b from-blue-500/40 to-transparent min-h-[40px]" />
      </div>

      {/* Content card */}
      <div className="flex-1 pb-10 min-w-0">
        <div className="overflow-hidden border rounded-2xl border-white/10 bg-white/5 backdrop-blur-sm">
          {/* Text content */}
          {hasText && (
            <div className="px-5 pt-5 sm:px-7 sm:pt-6 pb-3">
              {section.heading && (
                <h3 className="mb-2 text-xl font-extrabold leading-tight text-white sm:text-2xl">
                  {section.heading}
                </h3>
              )}
              {section.content_text && (
                <div
                  className="text-sm leading-relaxed whitespace-pre-wrap text-white/75 sm:text-base"
                  dangerouslySetInnerHTML={{ __html: section.content_text }}
                />
              )}
            </div>
          )}

          {/* Embedded videos */}
          {hasEmbeds && (
            <div className={`px-5 sm:px-7 ${hasText ? "pb-3" : "pt-5 sm:pt-6 pb-3"} space-y-4`}>
              {embeds.map((embed, i) => (
                <EmbedRenderer key={i} url={embed.url} title={embed.title} />
              ))}
            </div>
          )}

          {/* Images */}
          {hasImages && (
            <div className={hasText || hasEmbeds ? "" : "pt-2"}>
              {hasMultipleImages ? (
                <ImageGrid images={images} />
              ) : (
                <ImageCarousel images={images} />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ContentSection;
