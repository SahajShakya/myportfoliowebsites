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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestinomial = async () => {
      try {
        const data = await api.get("/testimonials");
        setTestinomial(data.data || []);
      } catch (error) {
        console.error("Error fetching testimonials: ", error);
      }
      setLoading(false);
    };

    fetchTestinomial();
  }, []);

  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>What others say</p>
        <h2 className={styles.sectionHeadText}>Testimonials.</h2>
      </motion.div>

      <div className="w-full flex">
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
        >
          Here&apos;s what people have to say about working with me.
        </motion.p>
      </div>

      {loading ? (
        <p className="mt-20 text-secondary text-[16px]">Loading...</p>
      ) : testinomail.length === 0 ? (
        <p className="mt-20 text-secondary text-[16px]">No testimonials found yet.</p>
      ) : (
        <div className="mt-20 overflow-x-auto scroll-smooth flex gap-7 pb-4">
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
      )}
    </>
  );
};

export default SectionWrapper(Feedbacks, "feedbacks");
