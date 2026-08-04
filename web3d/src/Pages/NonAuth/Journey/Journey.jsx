import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { textVariant } from "../../../utils/motion";
import { useJourneyQuery } from "../../../Hooks/options/useJourneyQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";
import { useNavigate } from "react-router-dom";

const NODE_SIZE = 44;
const SEG_H = 320;

// Pattern: left, center, right, center repeats
const NODE_X_PCT = [20, 50, 80, 50];

const TimelineCard = ({ journeyItem, index }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const navigate = useNavigate();

  const xPct = NODE_X_PCT[index % 4];
  const isCenter = xPct === 50;

  const startYear = journeyItem.start_date
    ? new Date(journeyItem.start_date).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      })
    : "Unknown";
  const endYear = !journeyItem.end_date || isNaN(new Date(journeyItem.end_date).getTime())
    ? "Present"
    : new Date(journeyItem.end_date).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      });

  const iconUrl =
    typeof journeyItem.icons?.[0] === "string"
      ? journeyItem.icons[0]
      : (journeyItem.icons?.[0]?.icon_url || journeyItem.icon_url || "");

  const handleCardClick = () => {
    navigate(`/journey/${journeyItem.id}`);
  };

  // Center cards are narrower, side cards take half minus gap
  const cardStyle = isCenter
    ? { left: "50%", transform: "translateX(-50%)", width: "45%" }
    : xPct < 50
    ? { left: "0", width: "calc(50% - 60px)" }
    : { right: "0", width: "calc(50% - 60px)" };

  return (
    <div ref={ref} className="absolute left-0 right-0 cursor-pointer group" onClick={handleCardClick} style={{ height: SEG_H }}>
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute"
        style={{ ...cardStyle, top: "50%", transform: isCenter ? "translate(-50%,-50%)" : "translateY(-50%)" }}
      >
        <div
          className="relative rounded-xl overflow-hidden border border-white/10 transition-all duration-300 group-hover:border-sky-500/30 group-hover:shadow-[0_8px_30px_rgba(56,189,248,0.2)]"
          style={{
            background: journeyItem.background_image_url
              ? `url(${journeyItem.background_image_url}) center/cover no-repeat`
              : "rgba(255,255,255,0.05)",
            minHeight: 160,
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-wider text-sky-400 uppercase">
                {startYear} — {endYear}
              </span>
            </div>
            <h3 className="mb-1 text-sm font-extrabold leading-tight text-white md:text-base">
              {journeyItem.title}
            </h3>
            <p className="mb-0.5 text-xs font-semibold text-sky-400/80">
              {journeyItem.office_name}
            </p>
            <p className="mb-1 text-[11px] text-white/50">
              {journeyItem.designation}
            </p>
            {journeyItem.description && (
              <div
                className="mt-1.5 text-[11px] leading-relaxed text-white/60 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: journeyItem.description }}
              />
            )}
            <div className="pt-2 mt-3 border-t border-white/10">
              <span className="text-[11px] font-semibold text-sky-400/70 transition-all duration-300 group-hover:translate-x-1 inline-block">
                View Details →
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Node dot */}
      <div
        className="absolute z-10"
        style={{ left: `${xPct}%`, top: "50%", transform: "translate(-50%, -50%)" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-sky-500/60 bg-[#0a0a1a] backdrop-blur-sm shadow-[0_0_20px_rgba(56,189,248,0.3)]"
        >
          {iconUrl ? (
            <img src={iconUrl} alt="" className="w-[55%] h-[55%] object-contain rounded-full" />
          ) : (
            <span className="text-sm font-black text-white">
              {journeyItem.title?.charAt(0) || "J"}
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const Journey = () => {
  const { data: journeyData } = useJourneyQuery();
  const { data: bgImage } = useSectionBgQuery("journey_bg_image");
  const journey = (journeyData || []).sort(
    (a, b) => new Date(a.start_date) - new Date(b.start_date)
  );

  const count = journey.length;
  const totalH = count > 0 ? count * SEG_H : 0;

  // Build zigzag path connecting nodes in order
  const nodeY = (i) => i * SEG_H + SEG_H / 2;
  const nodeX = (i) => NODE_X_PCT[i % 4];

  let pathD = "";
  for (let i = 0; i < count; i++) {
    const x = nodeX(i);
    const y = nodeY(i);
    pathD += `${i === 0 ? "M" : " L"} ${x} ${y}`;
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Fixed background layer */}
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
      {bgImage && <div className="absolute inset-0 bg-black/40 -z-[5]" />}

      <div className="relative z-10 w-full max-w-5xl px-4 py-12 mx-auto sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div variants={textVariant()} className="mb-16 text-center">
          <p className="mb-2 text-sm font-medium tracking-wider uppercase text-white/50">
            My Journey
          </p>
          <h1 className="text-4xl font-black text-white sm:text-5xl">
            Work Experience
          </h1>
          <p className="max-w-2xl mx-auto mt-4 text-base text-white/60 sm:text-lg">
            Here&apos;s a glimpse into my career journey, working with incredible teams
            and growing my skills.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative" style={{ height: totalH }}>
          {/* Zigzag SVG line */}
          <svg
            width="100%"
            height={totalH}
            viewBox={`0 0 100 ${totalH}`}
            preserveAspectRatio="none"
            className="absolute inset-0 pointer-events-none z-0"
          >
            <defs>
              <linearGradient id="zigzag-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <path
              d={pathD}
              fill="none"
              stroke="url(#zigzag-grad)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Cards */}
          <div className="relative z-10" style={{ height: totalH }}>
            {journey.map((item, index) => (
              <div key={item.id} className="absolute left-0 right-0" style={{ top: index * SEG_H }}>
                <TimelineCard journeyItem={item} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-white/40">
            Click on any node to explore the details of that journey.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Journey;
