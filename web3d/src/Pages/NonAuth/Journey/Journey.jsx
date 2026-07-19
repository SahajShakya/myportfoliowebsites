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

const Journey = () => {
  const { data: journeyData } = useJourneyQuery();
  const journey = (journeyData || []).sort(
    (a, b) => new Date(a.start_date) - new Date(b.start_date)
  );

  return (
    <section className="max-container px-4 sm:px-6 lg:px-8 py-6">
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} text-center`}>My Journey</p>
        <h2 className={`${styles.sectionHeadText} text-center`}>
          Work Experience
        </h2>
        <p className="text-center text-base sm:text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
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
                        src={journeyItem.icons[0]}
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
                    background: "#f0f9ff",
                    color: "#1e293b",
                    borderLeft: "4px solid #0ea5e9",
                    boxShadow: "0 4px 12px rgba(14,165,233,0.1)",
                    padding: "1.5rem",
                    minHeight: "320px",
                    borderRadius: "12px",
                  }}
                  contentArrowStyle={{ borderRight: "7px solid #f0f9ff" }}
                >
                  <div className="mb-4">
                    <h3 className="text-slate-800 text-xl sm:text-2xl font-bold mb-2 line-clamp-2">
                      {journeyItem.title}
                    </h3>
                    <p className="text-sky-700 font-semibold text-sm sm:text-base mb-1">
                      {journeyItem.office_name}
                    </p>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      {journeyItem.designation}
                    </p>
                  </div>

                  <div
                    className="my-4 text-slate-600 text-xs sm:text-sm leading-relaxed tracking-wider line-clamp-4 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: journeyItem.contents }}
                  />

                  <div className="mt-4 pt-3 border-t border-sky-200">
                    <a
                      href={journeyItem.url_of_company}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-800 text-sm sm:text-base font-bold transition-colors duration-300 underline"
                    >
                      Visit: {journeyItem.office_name}
                    </a>
                  </div>
                </VerticalTimelineElement>
              );
            })}
          </VerticalTimeline>
        </div>
      </div>

      <hr className="border-slate-200 my-8" />
    </section>
  );
};

export default Journey;