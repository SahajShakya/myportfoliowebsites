import React from "react";
import { motion } from "framer-motion";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { styles } from "../../../styles";
import { SectionWrapper } from "../../../hoc";
import { textVariant } from "../../../utils/motion";
import { useAcademicsQuery } from "../../../Hooks/options/useAcademicsQuery";

const ExperienceCard = ({ education }) => {
  const startYear = new Date(education.start_date).getFullYear();
  const endYear = new Date(education.end_date).getFullYear();
  return (
    <VerticalTimelineElement
      className="ver tical-timeline-element--work"
      contentStyle={{
        background: "#1d1836",
        color: "#fff",
        borderBottom: "8px",
        borderStyle: "solid",
        borderBottomColor: "#6c5ce7",
        boxShadow: "0 3px 0 #6c5ce7",
        padding: "1.5rem",
        minHeight: "320px",
      }}
      contentArrowStyle={{ borderRight: "7px solid #1d1836" }}
      date={
        <span
          className="text-base font-semibold sm:text-lg"
          style={{ color: "#1d1836" }}
        >
          {`${startYear} - ${endYear}`}
        </span>
      }
      icon={
        <div className="flex items-center justify-center w-full h-full overflow-hidden bg-white rounded-full">
          <img
            src={education.icons[0]}
            alt={education.university_name}
            className="w-[80%] h-[80%] object-contain rounded-full"
          />
        </div>
      }
      iconStyle={{
        background: "#fff",
        boxShadow: "0 0 0 4px #6c5ce7",
      }}
    >
      <div className="mb-4">
        <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl line-clamp-2">
          {education.title}
        </h3>
        <p className="m-0 text-sm font-semibold text-secondary sm:text-base">
          {education.university_name}
        </p>
      </div>

      <div
        className="mt-4 overflow-hidden text-xs leading-relaxed tracking-wider text-white-100 sm:text-sm line-clamp-4"
        dangerouslySetInnerHTML={{ __html: education.contents }}
      />

      <div className="pt-3 mt-4 border-t border-gray-600">
        <a
          href={education.url_of_company || education.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-blue-400 underline transition-colors duration-300 hover:text-blue-300 sm:text-base"
        >
          {education.college_name}
        </a>
      </div>
    </VerticalTimelineElement>
  );
};

const Academics = () => {
  const { data: academicsData } = useAcademicsQuery();
  const academics = (academicsData || []).sort(
    (a, b) => new Date(a.start_date) - new Date(b.start_date)
  );

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} text-center`}>
          My Education Background
        </p>
        <h2 className={`${styles.sectionHeadText} text-center`}>
          Education Journey
        </h2>
      </motion.div>

      <div className="flex flex-col mt-12 sm:mt-16 lg:mt-20">
        <VerticalTimeline lineColor="#6c5ce7" animate={true}>
          {academics.map((education) => (
            <ExperienceCard key={education.id} education={education} />
          ))}
        </VerticalTimeline>
      </div>
    </div>
  );
};

export default SectionWrapper(Academics, "study");