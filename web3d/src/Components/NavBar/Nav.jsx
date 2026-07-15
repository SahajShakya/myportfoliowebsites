import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import api from "../../api/client";
import { useAuthContext } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";

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
  const [projects, setProjects] = useState([]);
  const [Acheivements, setAcheivement] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [profile, setProfile] = useState({});
  const [activeCv, setActiveCv] = useState(null);
  const [materialsUrl, setMaterialsUrl] = useState(null);

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
        const data = await api.get("/settings/cv-active");
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
    const fetchMaterialsUrl = async () => {
      try {
        const data = await api.get("/settings/materials_url");
        if (data.data?.value) {
          setMaterialsUrl(data.data.value);
        }
      } catch (error) {
        console.error("Error fetching materials URL:", error);
      }
    };
    fetchMaterialsUrl();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (authUser?.id) {
          const data = await api.get(`/auth/user/${authUser.id}`);
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
    { name: "About Me", hasDropdown: false, linkTo: "/me" },
    { name: "Contact", hasDropdown: false, linkTo: "/contact" },
  ];

  return (
    <motion.div
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between min-h-[44px] px-3 sm:px-4 md:px-6 lg:px-8 py-2 bg-black/30 backdrop-blur-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-content-center">
          {profile.profile_image ? (
            <img
              src={profile.profile_image}
              alt={profile.name || "Profile"}
              className="object-cover w-8 h-8 rounded-full sm:w-9 sm:h-9 md:w-10 md:h-10"
            />
          ) : (
            <img
              src={mypic}
              alt="Sahaj Shakya"
              className="object-cover rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9"
            />
          )}
          <div className="ml-2 text-white sm:ml-3 align-content-center align-item-center">
            <div className="text-sm font-semibold text-black sm:text-base md:text-lg">
              {profile.name || "Sahaj Shakya"}
            </div>
            <div className="flex items-center text-[11px] sm:text-xs md:text-sm">
              <FaEnvelope className="mr-1 text-blue-500" />
              <h3 className="text-blue-700">{profile.email || "saz.shakya@gmail.com"}</h3>
            </div>
            {profile.phone && (
              <div className="flex items-center text-[11px] sm:text-xs md:text-sm">
                <FaPhoneAlt className="mr-1 text-green-400" />
                <h3 className="text-green-700">{profile.phone}</h3>
              </div>
            )}
          </div>
        </div>

        <div className="flex-row hidden gap-1 md:gap-1 lg:gap-2 md:flex">
          {socialLinks.map((link) => {
            const IconComponent = ICON_MAP[link.icon_name];
            return (
              <StickyNavLink
                key={link.id}
                path={link.url}
                logo={
                  IconComponent ? (
                    <IconComponent size={18} />
                  ) : (
                    <span className="text-xs font-bold">
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

      <div className="z-50 flex-1 mx-4 sm:mx-6 md:mx-8">
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
                <a
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition bg-white border border-black rounded-full hover:bg-gray-100"
                >
                  Dashboard
                </a>
              )
            )}
            {!isAdmin && activeCv && (
              <a
                href={activeCv.file_url}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition bg-white border border-black rounded-full hover:bg-gray-100"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition bg-white border border-black rounded-full hover:bg-gray-100"
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
        className="text-white hover:text-gray-300"
      >
        <motion.span
          className="relative z-10 flex items-center justify-center transition-transform bg-gray-700 rounded-full w-7 h-7 hover:scale-110"
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
