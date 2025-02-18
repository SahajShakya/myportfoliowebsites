import React, { useState, useEffect } from "react";
import { Tilt } from "react-tilt";
import { motion } from "framer-motion";

import { styles } from "../../../styles";
import { SectionWrapper } from "../../../hoc";

import { fadeIn, textVariant } from "../../../utils/motion";
import { db } from "../../../firebase/firebase";

import { collection, getDoc, deleteDoc, getDocs } from "firebase/firestore";

// const testimonials = [
//   {
//     testimonial:
//       "A seasoned System Administrator, DevOps professional, and skilled Developer",
//     name: "Basant Shrestha",
//     designation: "CTO",
//     company: "Itconcerns",
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1SwmRGfZrw5B_L3n_ciLwUOrV9evLc3kyHVN4LlW09Q&s",
//   },
//   {
//     testimonial: "An exceptional team player and inspiring team lead, ",
//     name: "Er. Rabindra Khati",
//     designation: "HOD",
//     company: "Kantipur Engineering College",
//     image: "https://kec.edu.np/wp-content/uploads/2016/07/Rabindra-Khati.jpg",
//   },
//   {
//     testimonial: "Hard worker, Multi talented, Sincere, Highly Dedicated",
//     name: "Narad Karki",
//     designation: "VSAT and Radio Head",
//     company: "4Mercantile",
//     image:
//       "https://scontent.fktm3-1.fna.fbcdn.net/v/t1.6435-9/89457844_10157710019544760_5351301072088465408_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=be3454&_nc_ohc=_5ZbyE6CGi4AX-29sIY&_nc_ht=scontent.fktm3-1.fna&oh=00_AfDdeZKiVAZcvCUKVa_o-MKUil_ztDWX5YSLdSA5tUI3zw&oe=65A0AB4E",
//   },
// ];
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
// Feedbacks Component
const Feedbacks = () => {
  const [testinomail, setTestinomial] = useState([]);

  useEffect(() => {
    const fetchTestinomial = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "testimonials"));
        const achievementsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTestinomial(achievementsList);
      } catch (error) {
        console.error("Error fetching achievements: ", error);
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

      {/* Horizontal Scroll Container */}
      <div
        className={`-mt-20 pb-14 ${styles.paddingX} overflow-x-auto scroll-smooth flex gap-7`}
      >
        <motion.div
          animate={{
            x: ["0%", "-33.33%", "-66.66%", "0%"], // Define a seamless loop for 3 items
          }}
          transition={{
            duration: 9, // Adjust duration as needed
            ease: "linear", // Ensure smoothness
            repeat: Infinity, // Repeat infinitely
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
