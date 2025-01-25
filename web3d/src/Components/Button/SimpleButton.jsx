import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Import useNavigate



const SimpleButton = ({ to, text }) => {
  const navigate = useNavigate(); // Get the navigate function

  const handleClick = () => {
    navigate(to); // Navigate to the specified path
  };

  return (
    <div className="relative flex justify-center items-center">
      {/* The Button Wrapper */}
      <motion.button
        onClick={handleClick}
        className="relative inline-block text-[#248d6a] text-lg px-6 py-2 tracking-wide no-underline border-none rounded-md cursor-pointer"
        whileHover={{
          scale: 1.1,
          boxShadow: "0 20px 50px rgba(255, 255, 255, 0.05)",
        }}
      >
        {/* The content of the button (centered text) */}
        <span className="relative z-10 text-[#535546] hover:text-[#002b9d] transition-colors duration-300">
          {text}
        </span>
      </motion.button>
    </div>
  );
};

export default SimpleButton;
