import { getDocs, collection } from "firebase/firestore";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import { db } from "../../../firebase/firebase";
import "react-vertical-timeline-component/style.min.css";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { textVariant } from "../../../utils/motion";
import { styles } from "../../../styles";

const Journey = () => {
  const [journey, setJourney] = useState([]);

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "journey"));
        const journeyList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by startDate field (assuming startDate exists in your Firestore document)
        journeyList.sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate)
        );

        setJourney(journeyList);
      } catch (error) {
        console.error("Error fetching journey: ", error);
      }
    };

    fetchJourney();
  }, []);

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
          <VerticalTimeline
            lineColor="#6c5ce7"
            animate={true}
          >
            {journey.map((journeyItem) => {
              // Handle conditional logic for invalid endDate
              const formattedEndDate = isNaN(
                new Date(journeyItem.endDate).getTime()
              )
                ? "Present"
                : new Date(journeyItem.endDate).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  });

              return (
                <VerticalTimelineElement
                  key={journeyItem.id || journeyItem.office_name}
                  date={
                    <span className="text-base sm:text-lg font-semibold" style={{ color: "black" }}>
                      {`${new Date(journeyItem.startDate).toLocaleDateString(
                        "en-GB",
                        { month: "long", year: "numeric" }
                      )} - ${formattedEndDate}`}
                    </span>
                  }
                  icon={
                    <div className="flex justify-center items-center w-full h-full rounded-full overflow-hidden bg-white">
                      <img
                        src={journeyItem.icons[0].publicUrl}
                        alt={journeyItem.office_name}
                        className="w-[80%] h-[80%] object-contain rounded-full"
                      />
                    </div>
                  }
                  iconStyle={{ 
                    background: "#fff",
                    boxShadow: "0 0 0 4px #6c5ce7"
                  }}
                  contentStyle={{
                    borderBottom: "8px",
                    borderStyle: "solid",
                    borderBottomColor: "#6c5ce7",
                    boxShadow: "0 3px 0 #6c5ce7",
                    background: "#1d1836",
                    color: "#fff",
                    padding: "1.5rem",
                    minHeight: "320px", // Consistent minimum height
                  }}
                  contentArrowStyle={{ borderRight: "7px solid #1d1836" }}
                >
                  <div className="mb-4">
                    <h3 className="text-white text-xl sm:text-2xl font-bold mb-2 line-clamp-2">
                      {journeyItem.title}
                    </h3>
                    <p
                      className="text-gray-300 font-semibold text-sm sm:text-base mb-1"
                      style={{ margin: 0 }}
                    >
                      {journeyItem.office_name}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {journeyItem.designation}
                    </p>
                  </div>

                  <div
                    className="my-4 text-white-100 text-xs sm:text-sm leading-relaxed tracking-wider line-clamp-4 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: journeyItem.contents }}
                  />

                  <div className="mt-4 pt-3 border-t border-gray-600">
                    <a
                      href={journeyItem.urlofCompany}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm sm:text-base font-bold transition-colors duration-300 underline"
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
