/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { FiChevronDown, FiMenu, FiChevronUp, FiX } from "react-icons/fi";
import {  motion } from "framer-motion";

const Navbar = ({ tabs, token }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Track if the mobile menu is open
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open (for mobile)
  const menuRef = useRef(null);
  const location = useLocation(); // Get current location for active state

  // Check the window width on resize to determine if it's mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
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
        setOpenDropdown(null); // Close dropdowns too
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

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false);
      setOpenDropdown(null); // Close dropdowns when closing menu
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

  const handleLinkClick = () => {
    // Close menu and dropdowns when clicking a link
    setMenuOpen(false);
    setOpenDropdown(null);
  };

  const updatedTabs = tabs;

  return (
    <div className="relative">
      {/* Show Hamburger Icon on Mobile */}
      <div className="flex items-center justify-between w-full ">
        <div className="flex-1"></div>
        {/* Hamburger or X icon */}
        {isMobile && (
          <button
            onClick={toggleMenu}
            className="p-2 text-gray-800 lg:hidden"
            aria-label="Toggle Menu"
          >
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        )}
      </div>

      {/* Show the tabs if not on mobile */}
      {!isMobile && (
        <SlideTabs 
          tabs={updatedTabs} 
          isMobile={isMobile} 
          token={token} 
          currentPath={location.pathname}
        />
      )}

      {/* Only show the Simple Navbar on Mobile when menu is open */}
      {isMobile && menuOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          ref={menuRef}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 flex flex-col h-full w-[280px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SimpleNavbar
              tabs={updatedTabs}
              token={token}
              openDropdown={openDropdown}
              handleDropdownToggle={handleDropdownToggle}
              setMenuOpen={setMenuOpen}
              handleLinkClick={handleLinkClick}
              currentPath={location.pathname}
            />
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Simple Navbar for Mobile View
const SimpleNavbar = ({
  tabs,
  // eslint-disable-next-line no-unused-vars
  token,
  openDropdown,
  handleDropdownToggle,
  setMenuOpen,
  handleLinkClick,
  currentPath,
}) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <span className="text-sm font-semibold text-gray-800">Menu</span>
      <button
        onClick={() => setMenuOpen(false)}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
        aria-label="Close Menu"
      >
        <FiX size={20} />
      </button>
    </div>

    {/* Nav Items */}
    <ul className="flex-1 py-2 overflow-y-auto">
      {tabs.map((tab, index) => {
        const isActive = tab.linkTo
          ? currentPath === tab.linkTo
          : tab.dropdownOptions?.some((opt) => opt.to === currentPath);

        return (
          <li key={index} className="relative">
            {tab.linkTo ? (
              <Link
                to={tab.linkTo}
                onClick={handleLinkClick}
                className={`flex items-center px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? "text-blue-600 bg-blue-50 font-medium border-l-3 border-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.name}
              </Link>
            ) : (
              <>
                <button
                  className={`flex items-center justify-between w-full px-5 py-3 text-sm transition-colors ${
                    isActive
                      ? "text-blue-600 bg-blue-50 font-medium border-l-3 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => handleDropdownToggle(index)}
                >
                  <span>{tab.name}</span>
                  {tab.hasDropdown && (
                    <span className="text-gray-400">
                      {openDropdown === index ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                    </span>
                  )}
                </button>

                {tab.hasDropdown && openDropdown === index && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-b border-gray-100 bg-gray-50"
                  >
                    {tab.dropdownOptions?.map((option, optIdx) => (
                      <li key={optIdx}>
                        <Link
                          to={option.to}
                          onClick={handleLinkClick}
                          className={`block pl-10 pr-5 py-2.5 text-xs transition-colors ${
                            currentPath === option.to
                              ? "text-blue-600 bg-blue-50/50 font-medium"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {option.label}
                        </Link>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </>
            )}
          </li>
        );
      })}
    </ul>
  </div>
);

// SlideTabs component (unchanged)
// eslint-disable-next-line no-unused-vars
const SlideTabs = ({ tabs, isMobile, token, currentPath }) => {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null); // Track hovered tab

  const handleSetSelected = (value) => {
    setSelected(value);
  };

  return (
    <ul
      className={`relative mx-auto flex w-full max-w-7xl justify-around rounded-full py-1.5 px-1 ${
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
    setHovered(tab); // Show the dropdown when tab is hovered
  };

  const handleMouseLeave = () => {
    setHovered(null); // Hide the dropdown when mouse leaves the tab
  };

  return (
    <li
      onMouseEnter={handleMouseEnter}
      onClick={() => handleSetSelected(tab)}
      className={`relative z-10 block cursor-pointer px-2 py-1 text-[12px] sm:px-2.5 sm:text-[12px] md:px-3 lg:px-4 lg:text-[12px] border border-gray-300 ${
        hovered === tab || selected === tab
          ? "text-red-500 bg-gray-100 rounded-full"
          : "text-gray-700 rounded-full"
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
        <div
          className="absolute left-0 top-full pt-2 z-20 w-52"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-transparent rounded-md"
        >
          {/* Tab Name Line */}
          <div className="px-3 py-1.5 text-sm font-semibold text-gray-800 border border-gray-300 rounded-full mt-1">
            {children}
          </div>

          {/* Dropdown Items */}
          <ul className="mt-1">
            {dropdownOptions.map((option, index) => (
              <li key={index}>
                <Link
                  to={option.to}
                  className="block px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full mt-1"
                >
                  {option.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>
        </div>
      )}
      {/* Chevron icon */}
      {hasDropdown && (
        <FiChevronDown
          className="inline-block ml-2 text-sm text-gray-400"
          size={14}
        />
      )}
    </li>
  );
};

export default Navbar;
