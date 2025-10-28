// NotFound.jsx
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const EarnMoneyButton = () => {
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const moveButtonRandomly = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate distance from mouse to button center
    const buttonCenterX = rect.left + rect.width / 2;
    const buttonCenterY = rect.top + rect.height / 2;
    const distance = Math.sqrt(
      Math.pow(mouseX - buttonCenterX, 2) + Math.pow(mouseY - buttonCenterY, 2)
    );

    // Move button if mouse is within 150px
    if (distance < 150) {
      const maxX = window.innerWidth - 200;
      const maxY = window.innerHeight - 200;
      const minX = 50;
      const minY = 50;
      
      setPosition({
        x: Math.random() * (maxX - minX) + minX,
        y: Math.random() * (maxY - minY) + minY,
      });
    }
  };

  const handleClick = () => {
    alert("I am just joking! 😄");
  };

  useEffect(() => {
    // Set initial random position
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 200;
    setPosition({
      x: Math.random() * (maxX - 100) + 100,
      y: Math.random() * (maxY - 100) + 100,
    });
  }, []);

  return (
    <motion.button
      style={{ 
        position: "absolute", 
        top: `${position.y}px`, 
        left: `${position.x}px`,
        zIndex: 10
      }}
      onMouseMove={moveButtonRandomly}
      onClick={handleClick}
      className="px-6 py-3 font-semibold text-white bg-green-500 rounded-lg shadow-lg cursor-pointer hover:shadow-xl"
      animate={{ x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      💰 Earn Money
    </motion.button>
  );
};

const NotFound = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute bg-blue-500 rounded-full top-20 left-20 w-72 h-72 blur-3xl"></div>
        <div className="absolute bg-purple-500 rounded-full bottom-20 right-20 w-96 h-96 blur-3xl"></div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="z-10 mb-8 text-center text-white"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1 
          className="mb-4 font-bold text-transparent text-8xl sm:text-9xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          404
        </motion.h1>
        <motion.p 
          className="mb-2 text-xl text-gray-300 sm:text-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Oops! Page Not Found
        </motion.p>
        <motion.p 
          className="text-base text-gray-400 sm:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          The page you&apos;re looking for doesn&apos;t exist.
        </motion.p>
      </motion.div>

      {/* Desktop: Show both buttons */}
      {!isMobile && (
        <>
          {/* Earn Money Button - Only on Desktop */}
          <EarnMoneyButton />
          
          {/* Go Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="z-20"
          >
            <Link
              to="/"
              className="inline-block px-8 py-3 font-semibold text-white transition-all duration-300 bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600 hover:shadow-xl hover:scale-105"
            >
              🏠 Go Back to Homepage
            </Link>
          </motion.div>
        </>
      )}

      {/* Mobile: Show only Go Back button */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="z-20 mt-6"
        >
          <Link
            to="/"
            className="inline-block px-8 py-3 font-semibold text-center text-white transition-all duration-300 bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600"
          >
            🏠 Go Back to Homepage
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default NotFound;
