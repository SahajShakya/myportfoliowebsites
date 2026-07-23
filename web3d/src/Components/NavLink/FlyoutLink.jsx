import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FlyoutContent from "./FlyoutContent"; // Import FlyoutContent


const FlyoutLink = ({
  children,
  href,
  setDropdownVisible,
  handleOpenModal,
}) => {
  const [open, setOpen] = useState(false);

  const showFlyout = open;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative"
    >
      <a href={href} className="relative text-gray-800">
        {children}
        <span
          style={{
            transform: showFlyout ? "scaleX(1)" : "scaleX(0)",
          }}
          className="absolute -bottom-2 -left-2 -right-2 h-1 origin-left scale-x-0 rounded-full bg-indigo-300 transition-transform duration-300 ease-out"
        />
      </a>
      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-transparent text-gray-800 rounded-md py-2 px-4 z-50"
          >
            <div className="absolute -top-3 left-0 right-0 h-4 bg-transparent" />
            <FlyoutContent
              setDropdownVisible={setDropdownVisible}
              handleOpenModal={handleOpenModal}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlyoutLink;
