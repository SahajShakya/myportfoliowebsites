import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

// TabProps interface
interface TabProps {
  name: string;
  hasDropdown: boolean;
  linkTo?: string;
  dropdownOptions?: { label: string; to: string }[];
}

interface NavbarProps {
  tabs: TabProps[];
}

const Navbar = ({ tabs }: NavbarProps) => {
  return (
    <div className="bg-gray-200 pt-1 pb-5">
      <SlideTabs tabs={tabs} />
    </div>
  );
};

// SlideTabs component
const SlideTabs = ({ tabs }: { tabs: TabProps[] }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null); // Track hovered tab
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
    setSelected(val);
  };

  const totalTabs = tabs.length; // Get the total number of tabs

  return (
    <ul
      onMouseLeave={() => setHovered(null)} // Reset hover state when mouse leaves
      className="relative mx-auto flex w-full max-w-5xl justify-around rounded-full border-2 border-black bg-white p-1"
    >
      {tabs.map((tab, index) => (
        <Tab
          key={index}
          tab={index + 1} // Pass the index as the tab number
          setHovered={setHovered}
          hovered={hovered}
          hasDropdown={tab.hasDropdown}
          handleSetSelected={handleSetSelected}
          selected={selected}
          linkTo={tab.linkTo}
          dropdownOptions={tab.dropdownOptions ?? []} // Pass dropdown options with default empty array
        >
          {tab.name}
        </Tab>
      ))}

      <AnimatePresence>{selected !== null}</AnimatePresence>

      {/* Shifting Nub Animation */}
      {!isMobile && (
        <motion.li
          animate={{
            left: `calc(${(hovered ?? selected ?? 1) - 1} * ${
              100 / totalTabs
            }%)`, // Adjust position based on hovered or selected tab
            width: `calc(100% / ${totalTabs})`, // Dynamically set the width based on the number of tabs
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
            top: "calc(100% - 56px)", // Set the width of the nub to match the tab width (assuming variable number of tabs)
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)", // Added shadow for better visibility
          }}
        />
      )}
    </ul>
  );
};

// Tab component
const Tab = ({
  children,
  tab,
  setHovered,
  hovered,
  hasDropdown,
  handleSetSelected,
  selected,
  linkTo,
  dropdownOptions, // Accept dropdown options as props
}: {
  children: string;
  tab: number;
  setHovered: (val: number | null) => void;
  hovered: number | null;
  hasDropdown: boolean;
  handleSetSelected: (val: number | null) => void;
  selected: number | null;
  linkTo?: string;
  dropdownOptions: { label: string; to: string }[]; // Dropdown options
}) => {
  return (
    <li
      onMouseEnter={() => setHovered(tab)} // Set hovered tab
      onClick={() => handleSetSelected(tab)} // Set selected tab
      className={`relative z-10 block cursor-pointer px-3 py-1.5 text-xs uppercase md:px-5 md:py-3 md:text-base ${
        hovered === tab || selected === tab ? "text-red-500" : "text-black"
      }`}
    >
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
          className="absolute left-0 mt-2 w-60 bg-white shadow-lg rounded-md z-20"
        >
          {/* Tab Name Line (Background black) */}
          <div className="bg-black text-white px-4 py-2 text-lg font-semibold">
            {children}
          </div>

          {/* Dropdown Items Line (Background gray) */}
          <ul className="bg-gray-200">
            {dropdownOptions.map((option, index) => (
              <li key={index}>
                <Link
                  to={option.to}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
                >
                  {option.label}
                </Link>
              </li>
            ))}
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
