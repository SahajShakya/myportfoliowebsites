// NotFound.jsx
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
const EarnMoneyButton = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const moveButtonRandomly = () => {
    const maxX = window.innerWidth - 200; // Button width
    const maxY = window.innerHeight * 0.8 - 60; // Button height (80% height of the viewport minus button height)
    setPosition({
      x: Math.random() * maxX,
      y: Math.random() * maxY,
    });
  };

  const handleClick = () => {
    alert("Just kidding!");
  };

  return (
    <motion.div
      style={{ position: "absolute", top: position.y, left: position.x }}
      onMouseEnter={moveButtonRandomly}
      onClick={handleClick}
      className="px-6 py-3 bg-green-500 text-white rounded-lg cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      Earn Money
    </motion.div>
  );
};

const NotFound = () => {
  return (
    <div className="flex items-center justify-center h-[80vh] bg-gray-800 relative">
      <motion.div
        className="text-center text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-5xl font-bold mb-4">404 Not Found</h1>
        <p className="text-xl mb-6">
          Oops, the page you are looking for does not exist.
        </p>
      </motion.div>

      {/* Earn Money Button Inside 404 Page */}
      <EarnMoneyButton />

      {/* Go Back to Home Button */}
      <Link
        to="/"
        className="absolute bottom-10 px-6 py-3 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition"
      >
        Go Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
