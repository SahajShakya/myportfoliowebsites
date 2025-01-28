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
} from "react-icons/fa"; // Add chevron icons for dropdown

const AuthLayout = () => {
  const [activeTab, setActiveTab] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dropdowns, setDropdowns] = useState({
    academics: false,
    works: false,
    achievements: false,
  });

  // Function to handle the tab change
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Function to toggle sidebar collapse
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Function to toggle dropdown visibility for submenus
  const toggleDropdown = (tab) => {
    setDropdowns((prevState) => ({
      // Close all dropdowns, then toggle the clicked one
      ...Object.keys(prevState).reduce((acc, key) => {
        acc[key] = key === tab ? !prevState[key] : false;
        return acc;
      }, {}),
    }));
  };

  // Routes for each section
  const routes = [
    { name: "academics", label: "Academics" },
    { name: "works", label: "Works" },
    { name: "achievements", label: "Achievements" },
  ];

  // Create the dropdown items for each section (Create/View)
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
        {/* Sidebar */}
        <div
          className={`transition-all duration-300 ${
            isCollapsed
              ? "w-20 bg-black text-white" // Black background when collapsed
              : "w-64 bg-white text-black" // White background when expanded
          } p-4`}
        >
          <div className="flex justify-between items-center mb-6">
            {/* Sidebar toggle button */}
            <button onClick={toggleSidebar} className="text-black">
              {isCollapsed ? (
                <FaBars className="text-2xl text-white" /> // White icon when collapsed
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
                      ) : name === "works" ? (
                        <FaCogs className="text-xl text-white" />
                      ) : (
                        <FaLock className="text-xl text-white" />
                      )
                    ) : (
                      label
                    )}
                  </Link>
                  {!isCollapsed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent click from triggering tab change
                        toggleDropdown(name);
                      }}
                      className="text-blue-600"
                    >
                      {dropdowns[name] ? <FaChevronUp /> : <FaChevronDown />}
                    </button>
                  )}
                </div>
                {/* Dropdown for the section */}
                {!isCollapsed && dropdowns[name] && generateDropdownItems(name)}
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-100 p-6">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default AuthLayout;
