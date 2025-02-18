import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
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
} from "react-icons/fa"; // Add FaProjectDiagram

const AuthLayout = () => {
  const [activeTab, setActiveTab] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dropdowns, setDropdowns] = useState({
    academics: false,
    journey: false,
    achievements: false,
    projects: false, // Add projects dropdown state
  });

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleDropdown = (tab) => {
    setDropdowns((prevState) => ({
      ...Object.keys(prevState).reduce((acc, key) => {
        acc[key] = key === tab ? !prevState[key] : false;
        return acc;
      }, {}),
    }));
  };

  const routes = [
    { name: "academics", label: "Academics" },
    { name: "journey", label: "Journey" },
    { name: "projects", label: "Projects" },
    { name: "achievements", label: "Achievements" },
  ];

  const generateDropdownItems = (section) => (
    <ul className="ml-4 mt-2 space-y-2">
      <li>
        <Link to={`/auth/${section}/create`} className="block">
          Create
        </Link>
      </li>
      <li>
        <Link to={`/auth/${section}/view`} className="block">
          View
        </Link>
      </li>
    </ul>
  );

  return (
    <>
      <Nav />
      <div className="flex h-screen">
        <div
          className={`transition-all duration-300 ${
            isCollapsed
              ? "w-20 bg-black text-white"
              : "w-64 bg-white text-black"
          } p-4`}
        >
          <div className="flex justify-between items-center mb-6">
            <button onClick={toggleSidebar} className="text-black">
              {isCollapsed ? (
                <FaBars className="text-2xl text-white" />
              ) : (
                <FaTimes className="text-2xl text-black" />
              )}
            </button>
          </div>

          <ul className="space-y-6">
            {routes.map(({ name, label }) => (
              <li
                key={name}
                className={`cursor-pointer ${
                  activeTab === name ? "bg-gray-600" : "hover:bg-gray-300"
                } p-3 rounded-lg`}
                onClick={() => handleTabClick(name)}
              >
                <div className="flex items-center justify-between">
                  <Link
                    to={`/auth/${name}/view`}
                    className={`block ${isCollapsed ? "text-center" : ""}`}
                  >
                    {isCollapsed ? (
                      name === "academics" ? (
                        <FaUser className="text-xl text-white" />
                      ) : name === "journey" ? (
                        <FaCogs className="text-xl text-white" />
                      ) : name === "achievements" ? (
                        <FaLock className="text-xl text-white" />
                      ) : name === "projects" ? (
                        <FaProjectDiagram className="text-xl text-white" />
                      ) : null
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
          </ul>
        </div>

        <div className="flex-1 bg-gray-100 p-6">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
