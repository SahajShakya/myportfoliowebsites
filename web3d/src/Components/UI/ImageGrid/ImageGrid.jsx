/* eslint-disable react/prop-types */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ImageGrid = ({ images }) => {
  const [lightbox, setLightbox] = useState(null);
  const visibleImages = images.filter((img) => {
    const url = typeof img === "string" ? img : img.url || "";
    return url.length > 0;
  });
  const isOddLast = visibleImages.length > 1 && visibleImages.length % 2 !== 0;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleImages.map((img, i) => {
          const imgUrl = typeof img === "string" ? img : img.url || "";
          const imgTitle = typeof img === "string" ? "" : img.title || "";
          if (!imgUrl) return null;
          const isLastOdd = isOddLast && i === visibleImages.length - 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`relative overflow-hidden cursor-pointer rounded-xl group ${isLastOdd ? "sm:col-span-2" : ""}`}
              onClick={() => setLightbox(i)}
            >
              <img
                src={imgUrl}
                alt={imgTitle || `Image ${i + 1}`}
                className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                draggable={false}
              />
              <div className="absolute inset-0 transition-colors duration-300 bg-black/0 group-hover:bg-black/20" />
              {imgTitle && (
                <div className="absolute inset-x-0 bottom-0 p-2 pt-6 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-[11px] font-medium line-clamp-1">{imgTitle}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute z-50 flex items-center justify-center w-10 h-10 text-white transition rounded-full top-4 right-4 bg-white/10 backdrop-blur hover:bg-white/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p - 1 + visibleImages.length) % visibleImages.length); }}
              className="absolute z-50 flex items-center justify-center w-10 h-10 text-white transition -translate-y-1/2 rounded-full left-2 sm:left-6 top-1/2 bg-white/10 backdrop-blur hover:bg-white/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p + 1) % visibleImages.length); }}
              className="absolute z-50 flex items-center justify-center w-10 h-10 text-white transition -translate-y-1/2 rounded-full right-2 sm:right-6 top-1/2 bg-white/10 backdrop-blur hover:bg-white/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <motion.div
              key={lightbox}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl max-h-[85vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={visibleImages[lightbox].url}
                alt={visibleImages[lightbox].title || ""}
                className="object-contain w-full h-full rounded-lg"
              />
              {visibleImages[lightbox].title && (
                <p className="mt-3 text-sm font-medium text-center text-white">
                  {visibleImages[lightbox].title}
                </p>
              )}
              <p className="mt-1 text-xs text-center text-white/50">
                {lightbox + 1} / {visibleImages.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGrid;
