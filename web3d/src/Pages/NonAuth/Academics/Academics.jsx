import React, { useRef, useMemo, useEffect } from "react";
import { motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { textVariant } from "../../../utils/motion";
import { styles } from "../../../styles";
import { useAcademicsQuery } from "../../../Hooks/options/useAcademicsQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";

const CARD_HEIGHT = 320;
const CARD_GAP = 60;

const generateCurvedPath = (count) => {
  if (count === 0) return "";
  const centerX = 50;
  const segH = CARD_HEIGHT + CARD_GAP;
  let d = `M ${centerX} 0`;
  for (let i = 0; i < count; i++) {
    const y = i * segH + CARD_HEIGHT / 2;
    if (i < count - 1) {
      const nextY = y + segH;
      const bulge = i % 2 === 0 ? 10 : -10;
      d += ` C ${centerX + bulge} ${y + segH * 0.3}, ${centerX - bulge} ${y + segH * 0.7}, ${centerX} ${nextY}`;
    }
  }
  return d;
};

const ExperienceCard = ({ education, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const isLeft = index % 2 === 0;

  const startYear = new Date(education.start_date).getFullYear();
  const endYear = new Date(education.end_date).getFullYear();
  const iconUrl =
    typeof education.icons?.[0] === "string"
      ? education.icons[0]
      : education.icons?.[0]?.icon_url || "";

  const handleCardClick = () => {
    window.open(`/academics/${education.id}`, "_blank");
  };

  return (
    <div ref={ref} className="relative" style={{ minHeight: CARD_HEIGHT }}>
      {/* Date — Circle — Date row (always centered) */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-center justify-center gap-0 w-full mb-4"
      >
        <span className="flex-1 text-right pr-6 text-sm font-bold tracking-widest text-[#6c5ce7] sm:text-base">
          {startYear}
        </span>
        <div className="flex-1 max-w-[80px] h-[4px] bg-gradient-to-r from-transparent to-[#6c5ce7]" />
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 180 }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-[#6c5ce7] bg-white shadow-[0_0_25px_rgba(108,92,231,0.5)] z-10"
        >
          {iconUrl ? (
            <img src={iconUrl} alt="" className="w-[70%] h-[70%] object-contain rounded-full" />
          ) : (
            <span className="text-2xl font-black text-[#6c5ce7]">
              {education.title?.charAt(0) || "E"}
            </span>
          )}
        </motion.div>
        <div className="flex-1 max-w-[80px] h-[4px] bg-gradient-to-l from-transparent to-[#6c5ce7]" />
        <span className="flex-1 text-left pl-6 text-sm font-bold tracking-widest text-[#6c5ce7] sm:text-base">
          {endYear}
        </span>
      </motion.div>

      {/* Card — alternates left/right */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`flex ${isLeft ? "justify-start" : "justify-end"}`}
      >
        <div
          className="w-full sm:w-[45%] cursor-pointer group"
          onClick={handleCardClick}
        >
          <div
            className="relative rounded-2xl overflow-hidden transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_8px_40px_rgba(108,92,231,0.35)] border border-white/10"
            style={{
              background: education.background_image_url
                ? `url(${education.background_image_url}) center/cover no-repeat`
                : "rgba(255,255,255,0.05)",
              minHeight: 220,
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 p-6 sm:p-8">
              <h3 className="text-xl font-extrabold text-white mb-2 line-clamp-2 sm:text-2xl leading-tight">
                {education.title}
              </h3>
              <p className="text-sm font-semibold text-[#a78bfa] m-0 mb-1">
                {education.university_name}
              </p>
              <p className="text-xs text-white/60 m-0 mb-3">
                {education.college_name}
              </p>
              {education.description && (
                <div
                  className="text-sm leading-relaxed text-white/80 line-clamp-3 mt-2"
                  dangerouslySetInnerHTML={{ __html: education.description }}
                />
              )}
              <div className="mt-4 pt-3 border-t border-white/20">
                <span className="text-xs font-semibold text-[#a78bfa] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  View Details →
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CurvedTimelineLine = ({ count }) => {
  const containerRef = useRef(null);
  const progress = useMotionValue(0);
  const pathLength = useTransform(progress, [0, 1], [0, 1]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.8;
      const end = -rect.height * 0.2;
      const raw = 1 - (rect.top - end) / (start - end);
      progress.set(Math.min(1, Math.max(0, raw)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [progress]);

  const pathD = useMemo(() => generateCurvedPath(count), [count]);

  if (count === 0) return null;

  const totalH = count * (CARD_HEIGHT + CARD_GAP) - CARD_GAP;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0">
      <svg
        width="100%"
        height={totalH}
        viewBox={`0 0 100 ${totalH}`}
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="timeline-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6c5ce7" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6c5ce7" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#timeline-grad)"
          strokeWidth="8"
          opacity="0.3"
          vectorEffect="non-scaling-stroke"
        />
        {/* Animated progress line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#timeline-grad)"
          strokeWidth="10"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength }}
        />
      </svg>
    </div>
  );
};

const Academics = () => {
  const { data: academicsData } = useAcademicsQuery();
  const { data: bgImage } = useSectionBgQuery("academics_bg_image");
  const academics = (academicsData || []).sort(
    (a, b) => new Date(a.start_date) - new Date(b.start_date)
  );

  return (
    <div className="relative w-full min-h-screen">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0a0a1a",
        }}
      />
      {bgImage && <div className="absolute inset-0 bg-black/30 -z-[5]" />}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div variants={textVariant()}>
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase text-center mb-1">
            My Education Background
          </p>
          <h2 className="text-white font-black text-4xl sm:text-5xl md:text-6xl text-center">
            Education Journey
          </h2>
        </motion.div>

        <div className="relative mt-12 sm:mt-16">
          <CurvedTimelineLine count={academics.length} />

        <div className="relative z-10">
          {academics.map((education, index) => (
            <div
              key={education.id}
              style={{
                marginBottom:
                  index < academics.length - 1 ? CARD_GAP : 0,
              }}
            >
              <ExperienceCard education={education} index={index} />
              {index < academics.length - 1 && (
                <div className="flex justify-center -mt-2">
                  <div className="w-[4px] h-[140px] bg-[#6c5ce7]" />
                </div>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
};

export default Academics;
