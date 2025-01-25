import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom"; // For navigation

interface AnimatedButtonProps {
  to: string; // Path to navigate to
  text: string; // Text to display on the button
}

const AnimatedButton1: React.FC<AnimatedButtonProps> = ({ to, text }) => {
  return (
    <div className="relative flex justify-center items-center bottom-2">
      {/* The Button Wrapper */}
      <motion.div
        className="relative inline-block text-[#248d6a] text-lg px-6 py-2 tracking-wide no-underline"
        whileHover={{
          scale: 1.1,
          boxShadow: "0 20px 50px rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* Border Animation (single point moving along the border in a continuous manner) */}
        <motion.div
          className="absolute w-2 h-2 bg-[#80f875] rounded-full"
          initial={{ top: "-30%", left: "-20%", bottom: "-30%", right: "-20%" }} // Initial position
          animate={{
            top: ["0%", "0%", "100%", "100%", "0%"], // Move vertically
            left: ["0%", "100%", "100%", "0%", "0%"], // Move horizontally
          }}
          transition={{
            repeat: Infinity, // Keep looping the animation
            duration: 4, // Duration for one full cycle
            ease: "linear", // Smooth continuous movement
          }}
        />

        {/* The actual content of the button (centered text) */}
        <Link
          to={to}
          className="relative top-2 left-1 z-10 w-1 text-[#535546] hover:text-[#002b9d] transition-colors duration-300 pt-0 pl-0"
        >
          {text}
        </Link>
      </motion.div>
    </div>
  );
};

export default AnimatedButton1;
