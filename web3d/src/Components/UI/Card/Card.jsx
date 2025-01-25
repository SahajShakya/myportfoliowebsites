import React from "react";
import { motion } from "framer-motion";

const Card = ({ children }) => {
  return (
    <motion.div
      className="relative mx-auto flex max-w-5xl justify-around rounded-full border-2 border-black bg-white p-1 bottom-2 h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

export default Card;
