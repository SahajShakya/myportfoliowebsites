import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaLinkedin,
  FaGithub,
  FaYoutube,
  FaInstagram,
} from "react-icons/fa";
import Navbar from "./Navbar2";
import NavElement from "../NavLink/NavElement";
import mypic from "../../assets/mypic.png"; // Ensure you import your image correctly
import iconGoogle from "../../assets/logo/iconGoogle.png";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";

// Main Nav Component
const Nav = () => {
  const [projects, setProjects] = useState([]);
  const [Acheivements, setAcheivement] = useState([]);
  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectsList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Get the document ID
        ...doc.data(), // Get the rest of the data
      }));

      // Sort projects by startDate
      const sortedProjects = projectsList.sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      );

      setProjects(sortedProjects);
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchAcheivement = async () => {
      const querySnapshot = await getDocs(collection(db, "achievements"));
      const projectsList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Get the document ID
        ...doc.data(), // Get the rest of the data
      }));

      // Sort projects by startDate
      const sortedProjects = projectsList.sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      );

      setAcheivement(sortedProjects);
    };

    fetchAcheivement();
  }, []);

  const token = localStorage.getItem("authToken");
  const tabs = [
    { name: "Home", hasDropdown: false, linkTo: "/" },
    {
      name: "Projects",
      hasDropdown: true,
      dropdownOptions: [
        {
          label: projects.length > 0 ? projects[2].name : "Loading...",
          to: projects.length > 0 ? `/projects/${projects[2].id}` : "/",
        },
        {
          label: projects.length > 0 ? projects[1].name : "Loading...",
          to: projects.length > 0 ? `/projects/${projects[1].id}` : "/",
        },
        { label: "Show All", to: "/projects" },
      ],
    },
    {
      name: "Achievements",
      hasDropdown: true,
      dropdownOptions: [
        {
          label: Acheivements.length > 0 ? Acheivements[0].name : "Loading...",
          to:
            Acheivements.length > 0
              ? `/achievements/${Acheivements[0].id}`
              : "/",
        },
        {
          label: Acheivements.length > 0 ? Acheivements[1].name : "Loading...",
          to:
            Acheivements.length > 0
              ? `/achievements/${Acheivements[1].id}`
              : "/",
        },
        { label: "Show All", to: "/achievements" },
      ],
    },
    {
      name: "Publications",
      hasDropdown: false,
      linkTo: "https://scholar.google.com/citations?user=TyG1JqoAAAAJ&hl=en",
    },
    { name: "About Me", hasDropdown: false, linkTo: "/me" },
    { name: "Contact", hasDropdown: false, linkTo: "/contact" },
  ];

  console.log(Acheivements);

  return (
    <motion.div
      className="flex items-center justify-between h-[20px] px-4 md:px-8 mt-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex justify-center mb-10 flex-col items-center">
        {/* Profile Image */}
        <div className="flex items-center justify-content-center mt-0">
          <img
            src={mypic} // Ensure mypic is correctly imported
            alt="Sahaj Shakya"
            className="w-10 h-8 md:w-2- md:h-10 rounded-full object-cover mt-6"
          />
          <div className="ml-4 text-white align-content-center align-item-center">
            <div className="font-semibold text-lg md:text-xl text-black">
              Sahaj Shakya
            </div>
            <div className="flex items-center text-sm md:text-base">
              <FaEnvelope className="mr-2 text-blue-500" />
              <h3 className="text-blue-700">saz.shakya@gmail.com</h3>
            </div>
            <div className="flex items-center text-sm md:text-base">
              <FaPhoneAlt className="mr-2 text-green-400" />
              <h3 className="text-green-700">977-9841194900</h3>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="flex-row gap-1 md:gap-1 hidden md:flex">
          <StickyNavLink
            path="https://github.com/sahajshakya"
            logo={<FaGithub size={28} />}
            name="GitHub"
          />
          <StickyNavLink
            path="https://www.linkedin.com/in/sahaj-shakya-98253710a/"
            logo={<FaLinkedin size={28} />}
            name="LinkedIn"
          />
          <StickyNavLink
            path="https://www.researchgate.net/profile/Sahaj-Shakya"
            logo={<span className="text-lg font-bold">RG</span>}
            name="ResearchGate"
          />
          <StickyNavLink
            path="https://scholar.google.com/citations?user=TyG1JqoAAAAJ&hl=en"
            // logo={<span className="text-lg font-bold">GS</span>}
            logo={
              <img src={iconGoogle} alt="Google Scholar" className="w-6 h-6" />
            }
            name="Google Scholar"
          />
          <StickyNavLink
            path="https://www.youtube.com/@KA1SKZ"
            logo={<FaYoutube size={28} />}
            name="YouTube"
          />
          <StickyNavLink
            path="https://www.instagram.com/kai_loves_to_click/"
            logo={<FaInstagram size={28} />}
            name="Instagram"
          />
        </div>
      </div>

      {/* Navbar Component */}
      <div className="flex-1 mx-8 z-50">
        <Navbar tabs={tabs} token={token} />
      </div>

      {/* Additional Nav Element */}
      <div className="flex gap-5 hidden md:flex">
        <NavElement
          token={token}
          path="https://engineeringstudymaterials.com/"
          pathName="Materials"
        />
      </div>
    </motion.div>
  );
};

// StickyNavLink Component
const StickyNavLink = ({ path, logo, name }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const textX = useTransform(x, (latest) => latest * 0.5);
  const textY = useTransform(y, (latest) => latest * 0.5);

  return (
    <motion.div
      className="relative inline-block"
      onPointerMove={(event) => {
        const item = event.currentTarget;
        setTransform(item, event, x, y);
      }}
      // onHoverStart={(event) => {
      //   const item = event.currentTarget;
      //   setTransform(item, event, x, y);
      // }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y }}
    >
      <a
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white hover:text-gray-300"
      >
        <motion.span
          className="z-10 relative flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 hover:scale-110 transition-transform"
          style={{ x: textX, y: textY }}
        >
          {logo}
        </motion.span>
      </a>
    </motion.div>
  );
};

// Utility Functions for Sticky Hover Effect
const mapRange = (inputLower, inputUpper, outputLower, outputUpper) => {
  const INPUT_RANGE = inputUpper - inputLower;
  const OUTPUT_RANGE = outputUpper - outputLower;

  return (value) =>
    outputLower + (((value - inputLower) / INPUT_RANGE) * OUTPUT_RANGE || 0);
};

const setTransform = (item, event, x, y) => {
  const bounds = item.getBoundingClientRect();
  const relativeX = event.clientX - bounds.left;
  const relativeY = event.clientY - bounds.top;
  const xRange = mapRange(0, bounds.width, -1, 1)(relativeX);
  const yRange = mapRange(0, bounds.height, -1, 1)(relativeY);
  x.set(xRange * 10); // Adjust intensity of the hover effect
  y.set(yRange * 10); // Adjust intensity of the hover effect
};

export default Nav;
