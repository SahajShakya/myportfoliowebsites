/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { useParams, useNavigate } from "react-router-dom";
import React from "react";
import { privateAgent } from "../../../api/authRequest";
import { routesName } from "../../../constants/routesName";
import EmbedRenderer from "../../../Components/UI/EmbedRenderer/EmbedRenderer";

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
      className="relative w-full overflow-hidden bg-transparent select-none"
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
          className="relative"
        >
          <img
            src={images[current].url}
            alt={images[current].title || `Image ${current + 1}`}
            className="w-full h-auto max-h-[80vh] object-contain"
            draggable={false}
          />
          {images[current].title && (
            <div className="absolute inset-x-0 top-0 p-5 pb-12 bg-gradient-to-b from-black/80 to-transparent">
              <p className="text-base font-semibold text-white">{images[current].title}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute z-10 flex items-center justify-center text-white transition-colors -translate-y-1/2 rounded-full left-3 top-1/2 w-9 h-9 bg-black/40 backdrop-blur-sm hover:bg-black/60"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute z-10 flex items-center justify-center text-white transition-colors -translate-y-1/2 rounded-full right-3 top-1/2 w-9 h-9 bg-black/40 backdrop-blur-sm hover:bg-black/60"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

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
                className="object-contain w-full h-auto transition-transform duration-500 group-hover:scale-105"
                draggable={false}
              />
              <div className="absolute inset-0 transition-colors duration-300 bg-black/0 group-hover:bg-black/20" />
              {imgTitle && (
                <div className="absolute inset-x-0 top-0 p-3 pb-8 bg-gradient-to-b from-black/80 to-transparent">
                  <p className="text-sm font-semibold text-white line-clamp-2">{imgTitle}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

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
              onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p - 1 + images.length) % images.length); }}
              className="absolute z-50 flex items-center justify-center w-10 h-10 text-white transition -translate-y-1/2 rounded-full left-2 sm:left-6 top-1/2 bg-white/10 backdrop-blur hover:bg-white/20"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setLightbox((p) => (p + 1) % images.length); }}
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
                src={images[lightbox].url}
                alt={images[lightbox].title || ""}
                className="object-contain w-full h-full rounded-lg"
              />
              {images[lightbox].title && (
                <p className="mt-3 text-sm font-medium text-center text-white">
                  {images[lightbox].title}
                </p>
              )}
              <p className="mt-1 text-xs text-center text-white">
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
  const hasText = !!(section.heading || section.content_text);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="relative flex gap-3 sm:gap-4"
    >
      {/* Timeline dot + line */}
      <div className="relative flex flex-col items-center flex-shrink-0">
        <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full shadow-lg bg-gradient-to-br from-sky-500 to-indigo-600 shadow-sky-500/25">
          <span className="text-[8px] font-bold text-white">{index + 1}</span>
        </div>
        <div className="w-px flex-1 bg-gradient-to-b from-sky-500/40 to-transparent min-h-[20px]" />
      </div>

      {/* Content card */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="overflow-hidden border rounded-xl border-white/10 bg-white/5 backdrop-blur-sm">
          {hasText && (
            <div className="px-3 pt-3 pb-2 sm:px-4 sm:pt-4">
              {section.heading && (
                <h3 className="mb-1 text-sm font-extrabold leading-tight text-white sm:text-base">
                  {section.heading}
                </h3>
              )}
              {section.content_text && (
                <div
                  className="text-[11px] leading-relaxed whitespace-pre-wrap text-white sm:text-xs"
                  dangerouslySetInnerHTML={{ __html: section.content_text }}
                />
              )}
            </div>
          )}

          {hasImages && (
            <div className={hasText ? "" : "pt-1"}>
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

const PromoContentSection = ({ content }) => {
  const images = (content.image_url || []).filter((img) => {
    const url = typeof img === "string" ? img : img.url || "";
    return url.length > 0;
  });

  let embeds = [];
  if (content.embed_urls) {
    try {
      const parsed = typeof content.embed_urls === "string" ? JSON.parse(content.embed_urls) : content.embed_urls;
      if (Array.isArray(parsed)) {
        embeds = parsed.filter((e) => e && e.url);
      }
    } catch {
      // ignore parse errors
    }
  }

  return (
    <div className="flex items-start gap-3">
      <span className="text-white text-xs mt-0.5 shrink-0">—</span>
      <div className="flex-1 min-w-0 space-y-3">
        {content.heading && (
          <h4 className="text-lg font-bold text-white">{content.heading}</h4>
        )}
        {content.content_text && (
          <p className="text-base leading-relaxed text-white">{content.content_text}</p>
        )}
        {embeds.length > 0 && (
          <div className="space-y-4">
            {embeds.map((embed, i) => (
              <EmbedRenderer key={i} url={embed.url} title={embed.title} />
            ))}
          </div>
        )}
        {images.length > 0 && (
          <div className="pt-1">
            {images.length > 1 ? <ImageGrid images={images} /> : <ImageCarousel images={images} />}
          </div>
        )}
      </div>
    </div>
  );
};

const JourneyDetails = () => {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const response = await privateAgent.get(routesName.JourneyRoute({ id }).get);
        const data = response.data;
        setJourney(data.data || null);
      } catch (error) {
        console.error("Error fetching journey details:", error);
      }
      setLoading(false);
    };
    fetchJourney();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 rounded-full border-sky-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-white">Journey not found</p>
        <button
          onClick={() => navigate("/journey")}
          className="text-sm font-semibold transition-colors text-white hover:text-white/80"
        >
          ← Back to Journey
        </button>
      </div>
    );
  }

  const startYear = journey.start_date
    ? new Date(journey.start_date).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";
  const endYear = !journey.end_date || isNaN(new Date(journey.end_date).getTime())
    ? "Present"
    : new Date(journey.end_date).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });

  const iconUrl =
    typeof journey.icons?.[0] === "string"
      ? journey.icons[0]
      : (journey.icons?.[0]?.icon_url || journey.icon_url || "");

  let contents = [];
  if (journey.contents && Array.isArray(journey.contents)) {
    contents = journey.contents;
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Fixed background layer */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: journey.background_image_url ? `url(${journey.background_image_url})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0a0a1a",
        }}
      />
      {journey.background_image_url && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] -z-[5]" />
      )}

      <div className="relative z-10">
        {/* Hero Banner */}
        <div className="relative w-full overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute bg-white rounded-full top-10 left-10 w-72 h-72 blur-3xl" />
            <div className="absolute bg-white rounded-full bottom-10 right-10 w-96 h-96 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-6xl px-4 pt-20 pb-3 mx-auto sm:px-6 lg:px-8 sm:pt-24 sm:pb-4 lg:pt-28 lg:pb-5">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => navigate("/journey")}
              className="flex items-center gap-2 mb-3 text-sm font-medium transition-colors text-white hover:text-white/80"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Journey
            </motion.button>

            <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-8">
              {/* Column 1 — icon + years */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center flex-shrink-0 gap-2"
              >
                <div className="flex items-center justify-center border-2 rounded-full shadow-xl w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm border-white/40">
                  {iconUrl ? (
                    <img src={iconUrl} alt={journey.office_name} className="w-[75%] h-[75%] object-contain rounded-full" />
                  ) : (
                    <span className="text-xl font-black text-white">{journey.title?.charAt(0) || "J"}</span>
                  )}
                </div>
                <span className="text-xs font-semibold tracking-wider text-white">{startYear} — {endYear}</span>
              </motion.div>

              {/* Column 2 — office, title, designation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col justify-center flex-shrink-0"
              >
                <p className="text-white text-xs font-medium tracking-wider uppercase mb-0.5">
                  {journey.office_name}
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1.5">
                  {journey.title}
                </h1>
                <span className="inline-block px-3 py-1 text-xs font-semibold text-white rounded-full bg-white/20 backdrop-blur-sm">
                  {journey.designation}
                </span>
              </motion.div>

              {/* Column 3 — description + links */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col flex-1 min-w-0 gap-3"
              >
                {journey.description && (
                  <div
                    className="text-sm leading-relaxed text-white"
                    dangerouslySetInnerHTML={{ __html: journey.description }}
                  />
                )}
                {journey.links && journey.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {journey.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white transition-all duration-300 rounded-full hover:text-white/80 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                      >
                        {link.label || "Link"}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Promotions Timeline — Parent / Child */}
        {journey.promotions && journey.promotions.length > 0 && (() => {
          const sorted = [...journey.promotions].sort(
            (a, b) => new Date(a.start_date || a.year) - new Date(b.start_date || b.year)
          );

          return (
            <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8">
              <div className="relative">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="mb-10"
                >
                  <h2 className="text-xl font-extrabold tracking-tight text-white">
                    Career Progression:
                  </h2>
                </motion.div>

                {/* Timeline items */}
                <div className="relative z-10 space-y-6">
                  {sorted.map((promo, promoIndex) => (
                    <motion.div
                      key={promo.id || promoIndex}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-20px" }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                    >
                      {/* Parent — Promotion */}
                      <div className="flex items-start gap-4">
                        {/* Dot */}
                        <div className="mt-1 shrink-0">
                          <div className="w-4 h-4 border-2 rounded-full shadow-lg bg-gradient-to-br from-sky-400 to-indigo-500 shadow-sky-500/30 border-white/20" />
                        </div>
                        {/* Parent details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {promo.start_date
                                ? new Date(promo.start_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                                : "Unknown"}
                              {promo.end_date
                                ? " — " + new Date(promo.end_date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                                : " — Present"}
                            </span>
                            {promo.position && (
                              <h3 className="text-lg font-bold text-white">
                                {promo.position}
                              </h3>
                            )}
                            {promo.description && (
                              <p className="w-full text-sm leading-relaxed text-white">
                                {promo.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Children — Content sections indented */}
                      {promo.content_items && promo.content_items.length > 0 && (
                        <div className="pl-5 mt-3 ml-8 space-y-3 border-l-2 border-white/10">
                          {promo.content_items.map((content, contentIndex) => (
                            <PromoContentSection
                              key={content.id || contentIndex}
                              content={content}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Content Sections — Timeline */}
        {contents.length > 0 && (
          <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
            <div className="ml-4 sm:ml-6">
              {contents.map((section, index) => (
                <ContentSection key={section.id || index} section={section} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyDetails;
