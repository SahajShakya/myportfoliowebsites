import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown, FiMenu, FiChevronUp, FiX } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

const Navbar = ({ tabs, token }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Track if the mobile menu is open
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open (for mobile)
  const menuRef = useRef(null);

  // Check the window width on resize to determine if it's mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768); // Assuming 768px as the breakpoint for mobile
    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile); // Add resize listener

    return () => {
      window.removeEventListener("resize", checkMobile); // Clean up listener
    };
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
    } else {
      setMenuOpen(true);
    }
  };

  const handleDropdownToggle = (index) => {
    if (isMobile) {
      // Toggle dropdown on mobile
      setOpenDropdown(openDropdown === index ? null : index);
    }
  };

  const updatedTabs =
    isMobile && token === null
      ? [...tabs, { name: "Login", hasDropdown: false, linkTo: "/vitra" }]
      : tabs;

  return (
    <div className="pt-1 pb-5 relative">
      {/* Show Hamburger Icon on Mobile */}
      <div className="flex justify-between items-center w-full">
        <div className="flex-1"></div>
        {/* Hamburger or X icon */}
        {isMobile && (
          <button
            onClick={toggleMenu}
            className="p-2 text-gray-600 lg:hidden"
            aria-label="Toggle Menu"
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        )}
      </div>

      {/* Show the tabs if not on mobile */}
      {!isMobile && (
        <SlideTabs tabs={updatedTabs} isMobile={isMobile} token={token} />
      )}

      {/* Only show the Simple Navbar on Mobile when menu is open */}
      {isMobile && menuOpen && (
        <div className="absolute inset-0 z-50 p-4" ref={menuRef}>
          <SimpleNavbar
            tabs={updatedTabs}
            token={token}
            openDropdown={openDropdown}
            handleDropdownToggle={handleDropdownToggle}
            setMenuOpen={setMenuOpen}
          />
        </div>
      )}
    </div>
  );
};

// Simple Navbar for Mobile View
const SimpleNavbar = ({
  tabs,
  token,
  openDropdown,
  handleDropdownToggle,
  setMenuOpen,
}) => (
  <ul className="flex flex-col items-start mt-4 bg w-auto w-[250px] rounded-lg shadow-lg bg-white absolute right-0 top-0 z-50">
    {/* Close Button (X Icon) */}
    <button
      onClick={() => setMenuOpen(false)} // Close the menu on click
      className="absolute top-0 right-0 p-2 text-gray-600"
      aria-label="Close Menu"
    >
      <FiX size={24} />
    </button>

    {/* Render Tabs */}
    {tabs.map((tab, index) => (
      <li key={index} className="text-center text-black text-lg relative">
        {tab.linkTo ? (
          <Link to={tab.linkTo} className="block py-2 px-4">
            {tab.name}
          </Link>
        ) : (
          <span
            className="block py-2 px-4 cursor-pointer flex"
            onClick={() => handleDropdownToggle(index)}
          >
            {tab.name}
            {tab.hasDropdown && (
              <span className="ml-2 text-sm">
                {openDropdown === index ? <FiChevronUp /> : <FiChevronDown />}
              </span>
            )}
          </span>
        )}

        {/* Show dropdown if the tab has a dropdown */}
        {tab.hasDropdown && openDropdown === index && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{ duration: 0.3 }}
            className="absolute right-0 mt-2 w-60 bg-white shadow-lg rounded-md z-20"
          >
            <ul>
              {tab.dropdownOptions?.map((option, index) => (
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
      </li>
    ))}
  </ul>
);

// SlideTabs component (unchanged)
const SlideTabs = ({ tabs, isMobile, token }) => {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null); // Track hovered tab

  const handleSetSelected = (val) => {
    setHovered(null);
    setSelected(val);
  };

  return (
    <ul
      className={`relative mx-auto flex w-full max-w-5xl justify-around rounded-full border-2 border-black bg-white p-1 ${
        isMobile ? "hidden" : ""
      }`}
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
    </ul>
  );
};

// Tab component with hover behavior
// Tab component with hover behavior
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
}) => {
  const handleMouseEnter = () => {
    setHovered(tab); // Set the hovered state to the current tab
  };

  const handleMouseLeave = () => {
    setHovered(null); // Reset the hovered state when the mouse leaves the tab
  };

  return (
    <li
      onMouseEnter={handleMouseEnter} // Show the dropdown when tab is hovered
      onMouseLeave={handleMouseLeave} // Reset the hover state when mouse leaves tab
      onClick={() => handleSetSelected(tab)} // Set selected tab on click
      className={`relative z-10 block cursor-pointer px-3 py-1.5 text-xs uppercase md:px-5 md:py-3 md:text-base ${
        hovered === tab || selected === tab
          ? "text-red-500 bg-gray-200 rounded-full" // Style for hovered or selected tabs
          : "text-black" // Default state for non-hovered, non-selected tabs
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
      {hasDropdown && hovered === tab && (
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
          <ul>
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
      {/* Chevron icon for dropdown */}
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
