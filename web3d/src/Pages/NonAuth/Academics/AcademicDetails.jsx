import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import { useParams, useNavigate } from "react-router-dom";
import React from "react";
import { privateAgent } from "../../../api/authRequest";
import { routesName } from "../../../constants/routesName";

const ImageCarousel = ({ images }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStart = useRef(null);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((p) => (p + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [images.length, next]);

  const variants = {
    enter: (d) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    touchStart.current = null;
  };

  return (
    <div
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={images[current].url}
            alt={images[current].title || `Image ${current + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {images[current].title && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
              <p className="text-white text-sm font-medium">{images[current].title}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setDirection(i > current ? 1 : -1);
                  setCurrent(i);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current ? "bg-white w-5" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ImageGrid = ({ images }) => {
  const [lightbox, setLightbox] = useState(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img, i) => {
          const imgUrl = typeof img === "string" ? img : img.url || "";
          const imgTitle = typeof img === "string" ? "" : img.title || "";
          if (!imgUrl) return null;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => setLightbox(i)}
            >
              <img
                src={imgUrl}
                alt={imgTitle || `Image ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                draggable={false}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              {imgTitle && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition z-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p - 1 + images.length) % images.length); }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition z-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p + 1) % images.length); }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur text-white flex items-center justify-center hover:bg-white/20 transition z-50"
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
                src={images[lightbox].url}
                alt={images[lightbox].title || ""}
                className="w-full h-full object-contain rounded-lg"
              />
              {images[lightbox].title && (
                <p className="text-white text-center text-sm mt-3 font-medium">
                  {images[lightbox].title}
                </p>
              )}
              <p className="text-white/50 text-center text-xs mt-1">
                {lightbox + 1} / {images.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

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

  const hasMultipleImages = images.length > 1;
  const hasImages = images.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="mb-10 rounded-2xl p-6 sm:p-8 border border-white/10"
    >
      {/* Text content */}
      {(section.heading || section.content_text) && (
        <div className="mb-5">
          {section.heading && (
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 leading-tight">
              {section.heading}
            </h3>
          )}
          {section.content_text && (
            <div
              className="text-white/80 text-sm sm:text-base leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: section.content_text }}
            />
          )}
        </div>
      )}

      {/* Images */}
      {hasImages && (
        <div className="mt-4">
          {hasMultipleImages ? (
            <ImageGrid images={images} />
          ) : (
            <ImageCarousel images={images} />
          )}
        </div>
      )}
    </motion.div>
  );
};

const AcademicDetails = () => {
  const [academic, setAcademic] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAcademic = async () => {
      try {
        const response = await privateAgent.get(routesName.AcademicsRoute({ id }).get);
        const data = response.data;
        setAcademic(data.data || null);
      } catch (error) {
        console.error("Error fetching academic details:", error);
      }
      setLoading(false);
    };
    fetchAcademic();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!academic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500 text-lg">Academic not found</p>
        <button
          onClick={() => navigate("/academics")}
          className="text-[#6c5ce7] hover:text-[#5a4bd1] font-semibold text-sm transition-colors"
        >
          ← Back to Academics
        </button>
      </div>
    );
  }

  const startYear = new Date(academic.start_date).getFullYear();
  const endYear = new Date(academic.end_date).getFullYear();
  const iconUrl =
    typeof academic.icons?.[0] === "string"
      ? academic.icons[0]
      : academic.icons?.[0]?.icon_url || "";

  let contents = [];
  if (academic.contents && Array.isArray(academic.contents)) {
    contents = academic.contents;
  }

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background: academic.background_image_url
          ? `url(${academic.background_image_url}) center/cover no-repeat fixed`
          : "#f9fafb",
      }}
    >
      {/* Dark overlay for entire page */}
      {academic.background_image_url && (
        <div className="fixed inset-0 backdrop-blur-[2px] -z-0" />
      )}

      <div className="relative z-10">
        {/* Hero Banner — translucent white */}
        <div className="relative w-full overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => navigate("/academics")}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-3 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Academics
          </motion.button>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
            {/* Column 1 — icon + years */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shadow-xl">
                {iconUrl ? (
                  <img src={iconUrl} alt={academic.university_name} className="w-[75%] h-[75%] object-contain rounded-full" />
                ) : (
                  <span className="text-xl font-black text-white">{academic.title?.charAt(0) || "E"}</span>
                )}
              </div>
              <span className="text-white/50 text-xs font-semibold tracking-wider">{startYear} — {endYear}</span>
            </motion.div>

            {/* Column 2 — university, title, college */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col justify-center flex-shrink-0"
            >
              <p className="text-white/60 text-xs font-medium tracking-wider uppercase mb-0.5">
                {academic.university_name}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1.5">
                {academic.title}
              </h1>
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                {academic.college_name}
              </span>
            </motion.div>

            {/* Column 3 — description + button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 flex flex-col gap-3 min-w-0"
            >
              {academic.description && (
                <div
                  className="text-white text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: academic.description }}
                />
              )}
              {academic.url_of_company && (
                <a
                  href={academic.url_of_company} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 self-start text-white hover:text-white/80 text-sm font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full transition-all duration-300"
                >
                  Visit Website
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      {contents.length > 0 && (
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-10">
            <p className="text-[#a78bfa] text-sm font-semibold tracking-wider uppercase mb-1">Details</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Content</h2>
          </motion.div>

          {contents.map((section, index) => (
            <ContentSection key={section.id || index} section={section} index={index} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default AcademicDetails;
