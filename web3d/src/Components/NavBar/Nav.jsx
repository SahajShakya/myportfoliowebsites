/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import PropTypes from "prop-types";
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
import { useAuthContext } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import { privateAgent } from "../../api/authRequest";
import { routesName } from "../../constants/routesName";
import { useProjectsQuery } from "../../Hooks/options/useProjectsQuery";
import { useAchievementsQuery } from "../../Hooks/options/useAchievementsQuery";
import { useSocialLinksQuery } from "../../Hooks/options/useSocialLinksQuery";
import { useCvActiveQuery, useMaterialsUrlQuery } from "../../Hooks/options/useSettingsQuery";

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
  const { user: contextUser, addData } = useUser();
  const location = useLocation();
  const isAuthPage = location.pathname.startsWith("/auth") || location.pathname.startsWith("/admin");
  const [profile, setProfile] = useState({});

  const { data: projectsData } = useProjectsQuery();
  const { data: achievementsData } = useAchievementsQuery();
  const { data: socialLinksData } = useSocialLinksQuery();
  const { data: activeCv } = useCvActiveQuery();
  const { data: materialsUrlData } = useMaterialsUrlQuery();

  const projects = projectsData || [];
  const Acheivements = achievementsData || [];
  const materialsUrl = materialsUrlData?.value || null;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (authUser?.id) {
          const response = await privateAgent.get(routesName.AuthRoute({}).user(authUser.id));
          const data = response.data;
          if (data.user) {
            setProfile(data.user);
            addData({ ...contextUser, ...data.user });
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchUserProfile();
  }, [authUser?.id]);



  const token = authUser?.id || null;
  const isAdmin = authUser?.role === "admin";

  const tabs = [
    { name: "Home", hasDropdown: false, linkTo: "/" },
    {
      name: "Projects",
      hasDropdown: true,
      dropdownOptions: isAdmin
        ? [
            { label: "Manage Projects", to: "/auth/projects/" },
            { label: "Create Project", to: "/auth/projects/create" },
            { label: "View Public", to: "/projects" },
          ]
        : [
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
      dropdownOptions: isAdmin
        ? [
            { label: "Manage Achievements", to: "/auth/achievements/" },
            { label: "Create Achievement", to: "/auth/achievements/create" },
            { label: "View Public", to: "/achievements" },
          ]
        : [
            {
              label: Acheivements.length > 0 ? Acheivements[0]?.name : "Loading...",
              to: Acheivements.length > 0 ? `/achievements/${Acheivements[0]?.id}` : "/",
            },
            {
              label: Acheivements.length > 0 ? Acheivements[1]?.name : "Loading...",
              to: Acheivements.length > 0 ? `/achievements/${Acheivements[1]?.id}` : "/",
            },
            { label: "Show All", to: "/achievements" },
          ],
    },
    {
      name: "Publications",
      hasDropdown: false,
      linkTo: "https://scholar.google.com/citations?user=TyG1JqoAAAAJ&hl=en",
    },
    ...(!isAdmin ? [{ name: "Academic Works", hasDropdown: false, linkTo: "/academic-projects" }] : []),
    { name: "Photography", hasDropdown: false, linkTo: "/photography" },
    { name: "About Me", hasDropdown: false, linkTo: "/me" },
    { name: "Contact", hasDropdown: false, linkTo: "/contact" },
  ];

  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 pb-1 pt-2 bg-white/80 backdrop-blur-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center">
        {profile.profile_image ? (
          <img
            src={profile.profile_image}
            alt={profile.name || "Profile"}
            className="object-cover rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8"
          />
        ) : (
          <img
            src={mypic}
            alt="Sahaj Shakya"
            className="object-cover w-6 h-6 rounded-full sm:w-7 sm:h-7 md:w-8 md:h-8"
          />
        )}
        <div className="hidden ml-2 text-gray-800 sm:ml-3 sm:block">
          <div className="text-xs font-semibold text-gray-900 sm:text-sm md:text-base">
            {profile.name || "Sahaj Shakya"}
          </div>
          <div className="flex items-center text-[10px] sm:text-[11px] md:text-xs">
            <FaEnvelope className="mr-1 text-blue-400" />
            <h3 className="text-blue-400">{profile.email || "saz.shakya@gmail.com"}</h3>
          </div>
          {profile.phone && (
            <div className="hidden items-center md:flex text-[10px] sm:text-[11px] md:text-xs">
              <FaPhoneAlt className="mr-1 text-green-400" />
              <h3 className="text-green-400">{profile.phone}</h3>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 mx-4 sm:mx-6 md:mx-8">
        <Navbar tabs={tabs} token={token} />
      </div>

      <div className="items-center hidden gap-2 md:flex">
        {token && (
          <>
            {isAdmin && (
              isAuthPage ? (
                <NavElement
                  token={token}
                  path={materialsUrl}
                  pathName="Materials"
                />
              ) : (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition text-gray-800 border border-gray-300 rounded-full hover:bg-gray-100"
                >
                  Dashboard
                </Link>
              )
            )}
            {!isAdmin && activeCv && (
              <a
                href={activeCv.file_url}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition text-gray-800 border border-gray-300 rounded-full hover:bg-gray-100"
              >
                <FaDownload className="text-xs" />
                <span>CV</span>
              </a>
            )}
            {!isAdmin && (
              <NavElement
                token={token}
                path={materialsUrl}
                pathName="Materials"
              />
            )}
            <NavElement token={token} />
          </>
        )}
        {!token && (
          <>
            {activeCv && (
              <a
                href={activeCv.file_url}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition text-gray-800 border border-gray-300 rounded-full hover:bg-gray-100"
              >
                <FaDownload className="text-xs" />
                <span>CV</span>
              </a>
            )}
            <NavElement
              token={token}
              path={materialsUrl}
              pathName="Materials"
            />
          </>
        )}
      </div>
    </motion.div>
  );
};

const StickyNavLink = ({ path, logo }) => {
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
        className="text-gray-800 hover:text-gray-500"
      >
        <motion.span
          className="relative z-10 flex items-center justify-center transition-transform bg-gray-200 rounded-full w-7 h-7 hover:scale-110"
          style={{ x: textX, y: textY }}
        >
          {logo}
        </motion.span>
      </a>
    </motion.div>
  );
};

StickyNavLink.propTypes = {
  path: PropTypes.string.isRequired,
  logo: PropTypes.element.isRequired,
  name: PropTypes.string.isRequired,
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