import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaLinkedin,
  FaGithub,
  FaYoutube,
  FaInstagram,
  FaGlobe,
  FaPhone,
  FaResearchgate,
  FaGraduationCap,
  FaReddit,
  FaDiscord,
  FaTwitch,
  FaMedium,
  FaDribbble,
  FaCodepen,
  FaFacebook,
  FaDownload,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Navbar from "./Navbar2";
import NavElement from "../NavLink/NavElement";
import mypic from "../../assets/mypic.png";
import api from "../../api/client";
import { useAuthContext } from "../../context/AuthContext";

const ICON_MAP = {
  FaGithub: FaGithub,
  FaLinkedin: FaLinkedin,
  FaYoutube: FaYoutube,
  FaInstagram: FaInstagram,
  FaEnvelope: FaEnvelope,
  FaGlobe: FaGlobe,
  FaPhone: FaPhone,
  FaResearchgate: FaResearchgate,
  FaGraduationCap: FaGraduationCap,
  FaReddit: FaReddit,
  FaDiscord: FaDiscord,
  FaTwitch: FaTwitch,
  FaMedium: FaMedium,
  FaDribbble: FaDribbble,
  FaCodepen: FaCodepen,
  FaXTwitter: FaXTwitter,
  FaFacebook: FaFacebook,
  FaPhoneAlt: FaPhoneAlt,
};

const Nav = () => {
  const { user: authUser } = useAuthContext();
  const [projects, setProjects] = useState([]);
  const [Acheivements, setAcheivement] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [profile, setProfile] = useState({});
  const [activeCv, setActiveCv] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get("/projects");
        const projectsList = data.data || [];
        const sortedProjects = projectsList.sort(
          (a, b) => new Date(a.start_date) - new Date(b.start_date)
        );
        setProjects(sortedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchAcheivement = async () => {
      try {
        const data = await api.get("/achievements");
        const achievementsList = data.data || [];
        setAcheivement(achievementsList);
      } catch (error) {
        console.error("Error fetching achievements:", error);
      }
    };
    fetchAcheivement();
  }, []);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const data = await api.get("/auth/social-links");
        setSocialLinks(data.data || []);
      } catch (error) {
        console.error("Error fetching social links:", error);
      }
    };
    fetchSocialLinks();
  }, []);

  useEffect(() => {
    const fetchActiveCv = async () => {
      try {
        const data = await api.get("/auth/cv-active");
        if (data.data) {
          setActiveCv(data.data);
        }
      } catch (error) {
        console.error("Error fetching active CV:", error);
      }
    };
    fetchActiveCv();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (authUser?.id) {
          const data = await api.get(`/auth/user/${authUser.id}`);
          if (data.user) {
            setProfile(data.user);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchUserProfile();
  }, [authUser?.id]);

  const token = authUser?.id || null;
  const tabs = [
    { name: "Home", hasDropdown: false, linkTo: "/" },
    {
      name: "Projects",
      hasDropdown: true,
      dropdownOptions: [
        {
          label: projects.length > 0 ? projects[2]?.name : "Loading...",
          to: projects.length > 0 ? `/projects/${projects[2]?.id}` : "/",
        },
        {
          label: projects.length > 0 ? projects[1]?.name : "Loading...",
          to: projects.length > 0 ? `/projects/${projects[1]?.id}` : "/",
        },
        { label: "Show All", to: "/projects" },
      ],
    },
    {
      name: "Achievements",
      hasDropdown: true,
      dropdownOptions: [
        {
          label: Acheivements.length > 0 ? Acheivements[0]?.name : "Loading...",
          to:
            Acheivements.length > 0
              ? `/achievements/${Acheivements[0]?.id}`
              : "/",
        },
        {
          label: Acheivements.length > 0 ? Acheivements[1]?.name : "Loading...",
          to:
            Acheivements.length > 0
              ? `/achievements/${Acheivements[1]?.id}`
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

  return (
    <motion.div
      className="flex items-center justify-between min-h-[80px] px-4 sm:px-6 md:px-8 lg:px-10 pt-3 sm:pt-4 md:pt-5 lg:pt-6 pb-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex justify-center flex-col items-center">
        <div className="flex items-center justify-content-center">
          {profile.profile_image ? (
            <img
              src={profile.profile_image}
              alt={profile.name || "Profile"}
              className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full object-cover"
            />
          ) : (
            <img
              src={mypic}
              alt="Sahaj Shakya"
              className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full object-cover"
            />
          )}
          <div className="ml-3 sm:ml-4 text-white align-content-center align-item-center">
            <div className="font-semibold text-base sm:text-lg md:text-xl text-black">
              {profile.name || "Sahaj Shakya"}
            </div>
            <div className="flex items-center text-xs sm:text-sm md:text-base">
              <FaEnvelope className="mr-1 sm:mr-2 text-blue-500" />
              <h3 className="text-blue-700">{profile.email || "saz.shakya@gmail.com"}</h3>
            </div>
            {profile.phone && (
              <div className="flex items-center text-xs sm:text-sm md:text-base">
                <FaPhoneAlt className="mr-1 sm:mr-2 text-green-400" />
                <h3 className="text-green-700">{profile.phone}</h3>
              </div>
            )}
          </div>
        </div>

        <div className="flex-row gap-1 md:gap-1 lg:gap-2 hidden md:flex">
          {socialLinks.map((link) => {
            const IconComponent = ICON_MAP[link.icon_name];
            return (
              <StickyNavLink
                key={link.id}
                path={link.url}
                logo={
                  IconComponent ? (
                    <IconComponent size={28} />
                  ) : (
                    <span className="text-lg font-bold">
                      {link.platform.substring(0, 2).toUpperCase()}
                    </span>
                  )
                }
                name={link.platform}
              />
            );
          })}
        </div>
      </div>

      <div className="flex-1 mx-4 sm:mx-6 md:mx-8 z-50">
        <Navbar tabs={tabs} token={token} />
      </div>

      <div className="hidden md:flex gap-3 sm:gap-4 lg:gap-5 items-center">
        {activeCv && (
          <a
            href={activeCv.file_url}
            download
            className="flex items-center gap-2 text-xl py-2 px-4 rounded-full border-2 border-black bg-white hover:bg-gray-100 transition"
          >
            <FaDownload className="text-sm" />
            <span>Download CV</span>
          </a>
        )}
        <NavElement
          token={token}
          path={profile.materials_url || "https://engineeringstudymaterials.com/"}
          pathName="Materials"
        />
      </div>
    </motion.div>
  );
};

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
  x.set(xRange * 10);
  y.set(yRange * 10);
};

export default Nav;
