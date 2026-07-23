import React from "react";
import { motion } from "framer-motion";
import { styles } from "../../../styles";
import { SectionWrapper } from "../../../hoc";
import { fadeIn, textVariant } from "../../../utils/motion";
import { useTestimonialsQuery } from "../../../Hooks/options/useTestimonialsQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";

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
    className="flex-none w-full sm:w-[320px] md:w-[400px] lg:w-[500px] bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-3xl mx-2"
  >
    <p className="text-[#a78bfa] font-black text-[48px]">"</p>

    <div className="mt-1">
      <p className="text-white/80 tracking-wider text-[18px]">{testimonial}</p>

      <div className="mt-7 flex justify-between items-center gap-1">
        <div className="flex-1 flex flex-col">
          <p className="text-white font-medium text-[16px]">
            <span className="text-[#a78bfa]">@</span> {name}
          </p>
          <p className="mt-1 text-white/50 text-[12px]">
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
  const { data: testimonialsData, isLoading } = useTestimonialsQuery();
  const { data: bgImage } = useSectionBgQuery("testimonials_bg_image");
  const testinomail = testimonialsData || [];

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background: bgImage
          ? `url(${bgImage}) center/cover no-repeat fixed`
          : "#0a0a1a",
      }}
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div variants={textVariant()}>
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase text-center mb-1">What others say</p>
          <h2 className="text-white font-black text-4xl sm:text-5xl md:text-6xl text-center">Testimonials.</h2>
        </motion.div>

        <div className="w-full flex">
          <motion.p
            variants={fadeIn("", "", 0.1, 1)}
            className="mt-3 text-white/70 text-[17px] max-w-3xl leading-[30px] mx-auto text-center"
          >
            Here&apos;s what people have to say about working with me.
          </motion.p>
        </div>

        {isLoading ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">Loading...</p>
        ) : testinomail.length === 0 ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">No testimonials found yet.</p>
        ) : (
          <div className="mt-16 overflow-x-auto scroll-smooth flex gap-7 pb-4 justify-center">
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
      </div>
    </div>
  );
};

export default Feedbacks;