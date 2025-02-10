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
  console.log(education);
  const startYear = new Date(education.startDate).getFullYear(); // Extract the year
  const endYear = new Date(education.endDate).getFullYear();
  return (
    <VerticalTimelineElement
      className="vertical-timeline-element--work"
      contentStyle={{
        background: "#1d1836",
        color: "#fff",
      }}
      contentArrowStyle={{ borderRight: "7px solid #1d1836" }}
      date={
        <span style={{ color: "#1d1836" }}>{`${startYear} - ${endYear}`}</span>
      }
      //   iconStyle={{ background: education.iconBg }}
      icon={
        <div className="flex justify-center items-center w-full h-full">
          <img
            src={education.icons[0].publicUrl}
            alt={education.university_name}
            className="w-[60%] h-[60%] object-contain"
          />
        </div>
      }
    >
      <div>
        <h3 className="text-white text-[24px] font-bold">{education.title}</h3>
        <p
          className="text-secondary text-[16px] font-semibold"
          style={{ margin: 0 }}
        >
          {education.university_name}
        </p>
      </div>

      <div
        className="mt-5 text-white-100 text-[14px] pl-1 tracking-wider"
        dangerouslySetInnerHTML={{ __html: education.contents }}
      />

      <div className="mt-2">
        <a
          href={education.url}
          target="_blank"
          className="text-white text-[16px] font-bold mt-3"
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
//         <p className="text-secondary text-sm font-semibold">
//           {education.university_name}
//         </p>
//       </div>

//       <div
//         className="mt-5 text-white text-sm pl-1 tracking-wider"
//         dangerouslySetInnerHTML={{ __html: education.contents }}
//       ></div>

//       <div className="mt-2">
//         <a
//           href={education.urlofCompany}
//           target="_blank"
//           rel="noopener noreferrer"
//           className="text-white text-sm font-bold mt-3"
//         >
//           {education.college_name}
//         </a>
//       </div>
//     </div>
//   );
// };

const Academics = () => {
  const [academics, setAcademics] = useState([]);
  const [isEdit, setIsEdit] = useState(false);

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
          (a, b) => new Date(b.startDate) - new Date(a.startDate)
        );

        setAcademics(academicList);
        setIsEdit(false);
      } catch (error) {
        console.error("Error fetching academics: ", error);
      }
    };

    fetchAcademics();
  }, []);

  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} text-center`}>
          My Education Background
        </p>
        <h2 className={`${styles.sectionHeadText} text-center`}>
          Education Journey
        </h2>
      </motion.div>

      <div className="mt-20 flex flex-col">
        <VerticalTimeline>
          {academics.map((education) => (
            <ExperienceCard key={education.id} education={education} />
          ))}
        </VerticalTimeline>
      </div>
    </>
  );
};

export default SectionWrapper(Academics, "study");
