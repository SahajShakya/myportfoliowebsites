import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import { FiChevronDown } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = () => {
  return (
    <div className="bg-neutral-100 pt-1 pb-5">
      {" "}
      {/* Removed py-20 and used pt-0 */}
      <SlideTabs />
    </div>
  );
};

const SlideTabs = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null); // Track hovered tab
  const [, setDir] = useState<null | "l" | "r">(null);
  const [isMobile, setIsMobile] = useState(false); // Track if it's mobile

  // Check the window width on resize to determine if it's a mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768); // Assuming 768px as the breakpoint for mobile
    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile); // Add resize listener

    return () => {
      window.removeEventListener("resize", checkMobile); // Clean up listener
    };
  }, []);

  const handleSetSelected = (val: number | null) => {
    if (typeof selected === "number" && typeof val === "number") {
      setDir(selected > val ? "r" : "l");
    } else if (val === null) {
      setDir(null);
    }

    setSelected(val);
  };

  return (
    <ul
      onMouseLeave={() => setHovered(null)} // Reset hover state when mouse leaves
      className="relative mx-auto flex w-full max-w-5xl justify-around rounded-full border-2 border-black bg-white p-1"
    >
      <Tab
        setHovered={setHovered}
        hovered={hovered}
        tab={1}
        hasDropdown={false} // Home tab with no dropdown
        handleSetSelected={handleSetSelected}
        selected={selected}
        linkTo="/" // Home route
      >
        Home
      </Tab>
      <Tab
        setHovered={setHovered}
        hovered={hovered}
        tab={2}
        hasDropdown={false} // Pricing tab with no dropdown
        handleSetSelected={handleSetSelected}
        selected={selected}
        linkTo="/pricing" // Pricing route
      >
        Pricing
      </Tab>
      <Tab
        setHovered={setHovered}
        hovered={hovered}
        tab={3}
        hasDropdown={true} // Features tab with dropdown
        handleSetSelected={handleSetSelected}
        selected={selected}
      >
        Features
      </Tab>
      <Tab
        setHovered={setHovered}
        hovered={hovered}
        tab={4}
        hasDropdown={true} // Docs tab with dropdown
        handleSetSelected={handleSetSelected}
        selected={selected}
      >
        Docs
      </Tab>
      <Tab
        setHovered={setHovered}
        hovered={hovered}
        tab={5}
        hasDropdown={false} // Home tab with no dropdown
        handleSetSelected={handleSetSelected}
        selected={selected}
        linkTo="/blog" // Home route
      >
        Blog
      </Tab>

      <AnimatePresence>{selected !== null}</AnimatePresence>

      {/* Shifting Nub Animation */}
      {/* Only apply animation for desktop */}
      {!isMobile && (
        <motion.li
          animate={{
            left: `calc(${(hovered ?? selected ?? 1) - 1} * 20%)`, // Adjust position based on hovered or selected tab
            width: `calc(100% / 5)`, // Set the width of the nub to match the tab width (assuming 5 tabs)
            height: "100%", // Set height to 2px
            opacity: hovered || selected ? 1 : 0,
            borderRadius: "50px",
          }}
          exit={{
            opacity: 0, // Fade out when leaving
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="absolute z-0 h-1 bg-black md:h-2"
          style={{
            top: "calc(100% - 56px)", // Set the width of the nub to match the tab width (assuming 5 tabs)
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)", // Added shadow for better visibility
          }}
        />
      )}
    </ul>
  );
};

const Tab = ({
  children,
  tab,
  setHovered,
  hovered,
  hasDropdown,
  handleSetSelected,
  selected,
  linkTo, // Add linkTo prop for routing
}: {
  children: string;
  tab: number;
  setHovered: (val: number | null) => void;
  hovered: number | null;
  hasDropdown: boolean;
  handleSetSelected: (val: number | null) => void;
  selected: number | null;
  linkTo?: string; // Optional linkTo prop
}) => {
  return (
    <li
      onMouseEnter={() => setHovered(tab)} // Set hovered tab
      onClick={() => handleSetSelected(tab)} // Set selected tab
      className={`relative z-10 block cursor-pointer px-3 py-1.5 text-xs uppercase md:px-5 md:py-3 md:text-base ${
        hovered === tab || selected === tab ? "text-red-500" : "text-black"
      }`}
    >
      {/* If linkTo is provided, wrap it with Link component */}
      {linkTo ? (
        <Link to={linkTo} className="block">
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      )}

      {/* Show dropdown if the tab has a dropdown and is hovered */}
      {hasDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: hovered === tab ? 1 : 0,
            y: hovered === tab ? 0 : -10,
          }}
          transition={{ duration: 0.3 }}
          className="absolute left-0 mt-2 w-60 bg-white shadow-lg rounded-md z-20" // Increased width here
        >
          {/* Tab Name Line (Background black) */}
          <div className="bg-black text-white px-4 py-2 text-lg font-semibold">
            {children}
          </div>

          {/* Dropdown Items Line (Background gray) */}
          <ul className="bg-gray-200">
            <li>
              <Link
                to="/option-1" // Example route for Option 1
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
              >
                Option 1
              </Link>
            </li>
            <li>
              <Link
                to="/option-2" // Example route for Option 2
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
              >
                Option 2
              </Link>
            </li>
            <li>
              <Link
                to="/option-3" // Example route for Option 3
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
              >
                Option 3
              </Link>
            </li>
          </ul>
        </motion.div>
      )}
      {/* Chevron icon */}
      {hasDropdown && (
        <FiChevronDown
          className="ml-2 inline-block text-sm text-gray-600"
          size={14}
        />
      )}
    </li>
  );
};

export default Navbar;
