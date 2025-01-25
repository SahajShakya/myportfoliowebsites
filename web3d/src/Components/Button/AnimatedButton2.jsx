import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom"; // For navigation

const AnimatedButton2 = ({ to, text }) => {
  return (
    <div className="relative flex justify-center items-center">
      {/* The Button Wrapper */}
      <motion.div
        className="relative inline-block text-[#34ffea] font-bold uppercase text-lg px-6 py-2 tracking-wide no-underline"
        whileHover={{
          scale: 1.1,
          boxShadow: "0 20px 50px rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Border Animation (four borders moving in different directions) */}
        <motion.span
          className="absolute w-full h-0.5 bg-gradient-to-r from-[#002b9d] to-[#34ffea]"
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "linear",
          }}
        />
        <motion.span
          className="absolute w-0.5 h-full bg-gradient-to-t from-[#002b9d] to-[#34ffea]"
          initial={{ top: "-100%" }}
          animate={{ top: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 2,
            delay: 1,
            ease: "linear",
          }}
        />
        <motion.span
          className="absolute w-full h-0.5 bg-gradient-to-l from-[#002b9d] to-[#34ffea] top-8"
          initial={{ left: "100%" }}
          animate={{ left: "-100%" }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "linear",
          }}
        />
        <motion.span
          className="absolute w-0.5 h-full bg-gradient-to-b from-[#002b9d] to-[#34ffea] left-20"
          initial={{ top: "100%" }}
          animate={{ top: "-100%" }}
          transition={{
            repeat: Infinity,
            duration: 2,
            delay: 1,
            ease: "linear",
          }}
        />

        {/* The actual content of the button (centered text) */}
        <Link
          to={to}
          className="relative z-10 text-[#34ffea] hover:text-[#002b9d] transition-colors duration-300"
        >
          {text}
        </Link>
      </motion.div>
    </div>
  );
};

export default AnimatedButton2;
