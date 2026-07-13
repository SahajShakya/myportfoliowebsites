import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { styles } from "../../../styles";
import { SectionWrapper } from "../../../hoc";
import { fadeIn, textVariant } from "../../../utils/motion";
import api from "../../../api/client";

const FeedbackCard = ({
  index,
  testimonial,
  name,
  designation,
  company,
  image,
}) => (
  <motion.div
    variants={fadeIn("", "spring", index * 0.5, 0.75)}
    className="flex-none w-full sm:w-[320px] md:w-[400px] lg:w-[500px] bg-black-200 p-10 rounded-3xl mx-2"
  >
    <p className="text-black font-black text-[48px]">"</p>

    <div className="mt-1">
      <p className="text-black tracking-wider text-[18px]">{testimonial}</p>

      <div className="mt-7 flex justify-between items-center gap-1">
        <div className="flex-1 flex flex-col">
          <p className="text-black font-medium text-[16px]">
            <span className="blue-text-gradient">@</span> {name}
          </p>
          <p className="mt-1 text-secondary text-[12px]">
            {designation} of {company}
          </p>
        </div>

        <img
          src={image}
          alt={`feedback_by-${name}`}
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>
    </div>
  </motion.div>
);

const Feedbacks = () => {
  const [testinomail, setTestinomial] = useState([]);

  useEffect(() => {
    const fetchTestinomial = async () => {
      try {
        const data = await api.get("/testimonials");
        setTestinomial(data.data || []);
      } catch (error) {
        console.error("Error fetching testimonials: ", error);
      }
    };

    fetchTestinomial();
  }, []);

  return (
    <div className="mt-12 bg-black-100 rounded-[20px]">
      <div
        className={`bg-tertiary rounded-2xl ${styles.padding} min-h-[300px]`}
      >
        <motion.div variants={textVariant()}>
          <p className={styles.sectionSubText}>What others say</p>
          <h2 className={styles.sectionHeadText}>Testimonials.</h2>
        </motion.div>
      </div>

      <div
        className={`-mt-20 pb-14 ${styles.paddingX} overflow-x-auto scroll-smooth flex gap-7`}
      >
        <motion.div
          animate={{
            x: ["0%", "-33.33%", "-66.66%", "0%"],
          }}
          transition={{
            duration: 9,
            ease: "linear",
            repeat: Infinity,
          }}
          className="flex gap-7"
        >
          {testinomail.map((testimonial, index) => (
            <FeedbackCard
              key={testimonial.name}
              index={index}
              {...testimonial}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SectionWrapper(Feedbacks, "feedbacks");
