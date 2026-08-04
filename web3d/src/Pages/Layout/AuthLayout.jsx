
import { Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Nav from "../../Components/NavBar/Nav";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaCogs,
  FaLock,
  FaChevronDown,
  FaChevronUp,
  FaProjectDiagram,
  FaAward,
  FaUserCircle,
  FaKey,
  FaShareAlt,
  FaQuoteLeft,
  FaCamera,
} from "react-icons/fa";

const AuthLayout = () => {
  const [activeTab, setActiveTab] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dropdowns, setDropdowns] = useState({
    academics: false,
    journey: false,
    achievements: false,
    projects: false,
    testimonials: false,
    photography: false,
    settings: false,
  });

  /** @param {string} tab */
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  /** @param {string} tab */
  const toggleDropdown = (tab) => {
    setDropdowns((prevState) => ({
      ...Object.keys(prevState).reduce((/** @type {Record<string, boolean>} */ acc, key) => {
        acc[key] = key === tab ? !prevState[key] : prevState[key];
        return acc;
      }, {}),
    }));
  };

  const routes = [
    { name: "academics", label: "Academics", icon: /** @type {React.ComponentType<{className?: string}>} */ (FaUser) },
    { name: "journey", label: "Journey", icon: /** @type {React.ComponentType<{className?: string}>} */ (FaCogs) },
    { name: "projects", label: "Projects", icon: /** @type {React.ComponentType<{className?: string}>} */ (FaProjectDiagram) },
    { name: "achievements", label: "Achievements", icon: /** @type {React.ComponentType<{className?: string}>} */ (FaAward) },
    { name: "testimonials", label: "Testimonials", icon: /** @type {React.ComponentType<{className?: string}>} */ (FaQuoteLeft) },
    { name: "photography", label: "Photography", icon: /** @type {React.ComponentType<{className?: string}>} */ (FaCamera) },
  ];

  const settingsItems = [
    { name: "profile", label: "Profile Settings", path: "/auth/profile", icon: /** @type {React.ComponentType<{className?: string}>} */ (FaUserCircle) },
    { name: "password", label: "Change Password", path: "/auth/password", icon: /** @type {React.ComponentType<{className?: string}>} */ (FaKey) },
    { name: "social-links", label: "Social Links", path: "/auth/social-links", icon: /** @type {React.ComponentType<{className?: string}>} */ (FaShareAlt) },
  ];

  /** @param {string} section */
  const generateDropdownItems = (section) => (
    <ul className="mt-2 ml-4 space-y-2">
      <li>
        <Link to={section === "academics" ? `/auth/${section}/` : `/auth/${section}/create`} className="block">
          Create
        </Link>
      </li>
    </ul>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Nav />
      <div className="flex flex-1 min-h-0">
        <div
          className={`transition-all duration-300 flex-shrink-0 overflow-y-auto ${
            isCollapsed
              ? "w-20 bg-black text-white"
              : "w-64 bg-white text-black"
          } pt-6 p-4`}
        >
          <div className="flex items-center justify-between mb-6">
            <button onClick={toggleSidebar} className="text-black">
              {isCollapsed ? (
                <FaBars className="text-2xl text-white" />
              ) : (
                <FaTimes className="text-2xl text-black" />
              )}
            </button>
          </div>

          <ul className="space-y-4">
            <li>
              <Link
                to="/admin/dashboard"
                className={`block p-3 rounded-lg ${
                  activeTab === "dashboard" ? "bg-gray-600 text-white" : "hover:bg-gray-200"
                }`}
                onClick={() => handleTabClick("dashboard")}
              >
                {isCollapsed ? <FaUser className="mx-auto text-xl text-white" /> : "Dashboard"}
              </Link>
            </li>

            {routes.map(({ name, label, icon: Icon }) => (
              <li
                key={name}
                className={`cursor-pointer ${
                  activeTab === name ? "bg-gray-600" : "hover:bg-gray-300"
                } p-3 rounded-lg`}
                onClick={() => handleTabClick(name)}
              >
                <div className="flex items-center justify-between">
                  <Link
                    to={name === "academics" || name === "journey" || name === "projects" || name === "achievements" || name === "photography" ? `/auth/${name}/` : name === "testimonials" ? `/auth/${name}` : `/auth/${name}/view`}
                    className={`block ${isCollapsed ? "text-center" : ""}`}
                  >
                    {isCollapsed ? (
                      <Icon className="text-xl text-white" />
                    ) : (
                      label
                    )}
                  </Link>
                  {!isCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(name);
                      }}
                      className="text-blue-600"
                    >
                      {dropdowns[name] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  )}
                </div>
                {!isCollapsed && dropdowns[name] && generateDropdownItems(name)}
              </li>
            ))}

            {!isCollapsed && <hr className="my-2" />}

            <li
              className={`cursor-pointer ${
                activeTab === "settings" ? "bg-gray-600" : "hover:bg-gray-300"
              } p-3 rounded-lg`}
              onClick={() => handleTabClick("settings")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaLock className="text-sm" />
                  <span>Settings</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown("settings");
                  }}
                  className="text-blue-600"
                >
                  {dropdowns["settings"] ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              {!isCollapsed && dropdowns["settings"] && (
                <ul className="mt-2 ml-4 space-y-2">
                  {settingsItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        className="flex items-center gap-2 text-sm hover:text-blue-500"
                      >
                        <item.icon className="text-xs" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
        </div>

        <div className="flex-1 min-w-0 p-6 overflow-y-auto bg-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
