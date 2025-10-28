import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { styles } from "../../../styles";
import { SectionWrapper } from "../../../hoc";
import { textVariant } from "../../../utils/motion";

// ExperienceCard Component

const ExperienceCard = ({ education }) => {
  const startYear = new Date(education.startDate).getFullYear(); // Extract the year
  const endYear = new Date(education.endDate).getFullYear();
  return (
    <VerticalTimelineElement
      className="vertical-timeline-element--work"
      contentStyle={{
        background: "#1d1836",
        color: "#fff",
        borderBottom: "8px",
        borderStyle: "solid",
        borderBottomColor: "#6c5ce7",
        boxShadow: "0 3px 0 #6c5ce7",
        padding: "1.5rem",
        minHeight: "320px", // Consistent minimum height
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
            src={education.icons[0].publicUrl}
            alt={education.university_name}
            className="w-[80%] h-[80%] object-contain rounded-full"
          />
        </div>
      }
      iconStyle={{ 
        background: "#fff",
        boxShadow: "0 0 0 4px #6c5ce7"
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
          href={education.urlofCompany || education.url}
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

// const ExperienceCard = ({ education }) => {
//   console.log(education);
//   return (
//     <div
//       className="bg-[#1d1836] text-white p-5 mb-6 rounded-lg"
//       key={education.id}
//     >
//       <div className="flex-col items-center justify-between">
//         <h3 className="text-xl font-bold">{education.title}</h3>
//         <p className="text-sm font-semibold text-secondary">
//           {education.university_name}
//         </p>
//       </div>

//       <div
//         className="pl-1 mt-5 text-sm tracking-wider text-white"
//         dangerouslySetInnerHTML={{ __html: education.contents }}
//       ></div>

//       <div className="mt-2">
//         <a
//           href={education.urlofCompany}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="mt-3 text-sm font-bold text-white"
//         >
//           {education.college_name}
//         </a>
//       </div>
//     </div>
//   );
// };

const Academics = () => {
  const [academics, setAcademics] = useState([]);

  useEffect(() => {
    const fetchAcademics = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "academics"));
        const academicList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by startDate field (assuming startDate exists in your Firestore document)
        academicList.sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate)
        );

        setAcademics(academicList);
      } catch (error) {
        console.error("Error fetching academics: ", error);
      }
    };

    fetchAcademics();
  }, []);

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
