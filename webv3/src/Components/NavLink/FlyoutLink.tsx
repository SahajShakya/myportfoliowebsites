import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FlyoutContent from "./FlyoutContent"; // Import FlyoutContent

type FlyoutLinkProps = {
  children: React.ReactNode;
  href: string;
  setDropdownVisible: React.Dispatch<React.SetStateAction<boolean>>;
  handleOpenModal: (type: "update" | "logout") => void; // Accept handleOpenModal
};

const FlyoutLink = ({
  children,
  href,
  setDropdownVisible,
  handleOpenModal,
}: FlyoutLinkProps) => {
  const [open, setOpen] = useState(false);

  const showFlyout = open;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative w-fit h-fit"
    >
      <a href={href} className="relative text-white">
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={{ translateX: "-50%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute left-1/2 top-12 bg-white text-black shadow-lg rounded-md py-2 px-4"
          >
            <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
            <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
            <FlyoutContent
              setDropdownVisible={setDropdownVisible}
              handleOpenModal={handleOpenModal} // Pass handleOpenModal to FlyoutContent
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlyoutLink;
