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
  const [isEdit, setIsEdit] = useState(false);

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
        setIsEdit(false);
      } catch (error) {
        console.error("Error fetching journey: ", error);
      }
    };

    fetchJourney();
  }, []);

  return (
    <section className="max-container">
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} text-center`}>My Journey</p>
        <h2 className={`${styles.sectionHeadText} text-center`}>
          Work Experience
        </h2>
        <p className={`${styles.sectionHeadText} text-center`}>
          Here's a glimpse into my career journey, working with incredible teams
          and growing my skills.
        </p>
      </motion.div>

      <div className="py-16">
        <div className="mt-12 flex">
          <VerticalTimeline
            lineColor="#6c5ce7"
            animate={true}
            layout="2-columns"
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
                  key={journeyItem.office_name}
                  date={
                    <span style={{ color: "black" }}>
                      {`${new Date(journeyItem.startDate).toLocaleDateString(
                        "en-GB",
                        { month: "long", year: "numeric" }
                      )} - ${formattedEndDate}`}
                    </span>
                  }
                  icon={
                    <div className="flex justify-center items-center w-full h-full rounded-full overflow-hidden">
                      <img
                        src={journeyItem.icons[0].publicUrl}
                        alt={journeyItem.office_name}
                        className="w-[15%] aspect-[3/2] object-contain mix-blend-color-burn rounded-lg"
                      />
                    </div>
                  }
                  contentStyle={{
                    borderBottom: "8px",
                    borderStyle: "solid",
                    borderBottomColor: "#6c5ce7", // Customize the color if needed
                    boxShadow: "none",
                    background: "#1d1836",
                    color: "#fff",
                  }}
                >
                  <div>
                    <h3 className="text-white text-xl font-poppins font-semibold">
                      {journeyItem.title}
                    </h3>
                    <p
                      className="text-white-500 font-medium text-base"
                      style={{ margin: 0 }}
                    >
                      {journeyItem.office_name}
                    </p>
                    <p className="text-white-500/50 text-sm">
                      {journeyItem.designation}
                    </p>
                  </div>

                  <div
                    className="my-5 text-white text-[16px] font-bold mt-3"
                    dangerouslySetInnerHTML={{ __html: journeyItem.contents }}
                  />

                  <div className="mt-2">
                    <a
                      href={journeyItem.urlofCompany}
                      target="_blank"
                      className="text-white text-[16px] font-bold mt-3"
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

      <hr className="border-slate-200" />
    </section>
  );
};

export default Journey;
