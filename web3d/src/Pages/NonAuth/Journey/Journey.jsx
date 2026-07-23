import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import React from "react";
import { motion } from "framer-motion";
import { textVariant } from "../../../utils/motion";
import { styles } from "../../../styles";
import { useJourneyQuery } from "../../../Hooks/options/useJourneyQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";

const Journey = () => {
  const { data: journeyData } = useJourneyQuery();
  const { data: bgImage } = useSectionBgQuery("journey_bg_image");
  const journey = (journeyData || []).sort(
    (a, b) => new Date(a.start_date) - new Date(b.start_date)
  );

  const handleCardClick = (id) => {
    window.open(`/journey/${id}`, "_blank");
  };

  return (
    <section
      className="w-full min-h-screen"
      style={{
        background: bgImage
          ? `url(${bgImage}) center/cover no-repeat fixed`
          : "#0a0a1a",
      }}
    >
      {bgImage && <div className="fixed inset-0 -z-0" />}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <motion.div variants={textVariant()}>
        <p className="text-white/60 text-sm font-medium tracking-wider uppercase text-center mb-1">My Journey</p>
        <h2 className="text-white font-black text-4xl sm:text-5xl md:text-6xl text-center">
          Work Experience
        </h2>
        <p className="text-center text-base sm:text-lg text-white/70 mt-4 max-w-3xl mx-auto">
          Here&apos;s a glimpse into my career journey, working with incredible teams
          and growing my skills.
        </p>
      </motion.div>

      <div className="py-8 sm:py-12 lg:py-16">
        <div className="mt-8 sm:mt-12 flex">
          <VerticalTimeline lineColor="#0ea5e9" animate={true}>
            {journey.map((journeyItem) => {
              const formattedEndDate = isNaN(
                new Date(journeyItem.end_date).getTime()
              )
                ? "Present"
                : new Date(journeyItem.end_date).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  });

              const iconUrl = typeof journeyItem.icons?.[0] === "string" ? journeyItem.icons[0] : journeyItem.icons?.[0]?.icon_url || "";

              return (
                <VerticalTimelineElement
                  key={journeyItem.id || journeyItem.office_name}
                  date={
                    <span className="text-base sm:text-lg font-semibold text-sky-600">
                      {`${new Date(
                        journeyItem.start_date
                      ).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })} - ${formattedEndDate}`}
                    </span>
                  }
                  icon={
                    <div className="flex justify-center items-center w-full h-full rounded-full overflow-hidden bg-white">
                      <img
                        src={iconUrl}
                        alt={journeyItem.office_name}
                        className="w-[80%] h-[80%] object-contain rounded-full"
                      />
                    </div>
                  }
                  iconStyle={{
                    background: "#fff",
                    boxShadow: "0 0 0 4px #0ea5e9",
                  }}
                  contentStyle={{
                    background: journeyItem.background_image_url
                      ? `url(${journeyItem.background_image_url}) center/cover no-repeat`
                      : "rgba(255,255,255,0.05)",
                    color: "#ffffff",
                    borderLeft: "4px solid #a78bfa",
                    boxShadow: "0 4px 12px rgba(108,92,231,0.15)",
                    padding: "1.5rem",
                    minHeight: "320px",
                    borderRadius: "12px",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  contentArrowStyle={{ borderRight: "7px solid rgba(255,255,255,0.05)" }}
                >
                  {journeyItem.background_image_url && (
                    <div
                      className="absolute inset-0 z-0"
                      style={{
                        background: `url(${journeyItem.background_image_url}) center/cover no-repeat`,
                        filter: "blur(2px)",
                      }}
                    />
                  )}
                  <div
                    className="relative z-10"
                    onClick={() => handleCardClick(journeyItem.id)}
                    style={{
                      background: journeyItem.background_image_url
                        ? "rgba(0,0,0,0.4)"
                        : "transparent",
                      margin: "-1.5rem",
                      padding: "1.5rem",
                      minHeight: "320px",
                    }}
                  >
                    <div className="mb-4">
                      <h3 className="text-white text-xl sm:text-2xl font-bold mb-2 line-clamp-2">
                        {journeyItem.title}
                      </h3>
                      <p className="text-[#a78bfa] font-semibold text-sm sm:text-base mb-1">
                        {journeyItem.office_name}
                      </p>
                      <p className="text-white/50 text-xs sm:text-sm">
                        {journeyItem.designation}
                      </p>
                    </div>

                    {journeyItem.description && (
                      <div
                        className="my-4 text-white/70 text-xs sm:text-sm leading-relaxed tracking-wider line-clamp-4 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: journeyItem.description }}
                      />
                    )}

                    <div className="mt-4 pt-3 border-t border-white/20">
                      <a
                        href={journeyItem.url_of_company}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#a78bfa] hover:text-white text-sm sm:text-base font-bold transition-colors duration-300 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit: {journeyItem.office_name}
                      </a>
                    </div>

                    <div className="mt-3">
                      <span className="text-xs text-[#a78bfa] font-medium">
                        Click to view details &rarr;
                      </span>
                    </div>
                  </div>
                </VerticalTimelineElement>
              );
            })}
          </VerticalTimeline>
        </div>
      </div>

      <hr className="border-slate-200 my-8" />
      </div>
    </section>
  );
};

export default Journey;
