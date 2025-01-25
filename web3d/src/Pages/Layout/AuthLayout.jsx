import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import Nav from "../../Components/NavBar/Nav";
import { FaBars, FaTimes, FaUser, FaCogs, FaLock } from "react-icons/fa"; // Import icons for the tabs

const AuthLayout = () => {
  const [activeTab, setActiveTab] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Function to handle the tab change
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Function to toggle sidebar collapse
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <Nav />
      <div className="flex h-screen">
        {/* Sidebar */}
        <div
          className={`transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"} bg-gray-200 text-black p-4`}
        >
          <div className="flex justify-between items-center mb-6">
            {/* Sidebar toggle button */}
            <button onClick={toggleSidebar} className="text-black">
              {isCollapsed ? (
                <FaBars className="text-2xl" />
              ) : (
                <FaTimes className="text-2xl" />
              )}
            </button>
          </div>

          <ul className="space-y-6">
            <li
              className={`cursor-pointer ${activeTab === "profile" ? "bg-blue-600" : "hover:bg-gray-300"} p-3 rounded-lg`}
              onClick={() => handleTabClick("profile")}
            >
              <Link
                to="/auth/profile"
                className={`block ${isCollapsed ? "text-center" : ""}`}
              >
                {isCollapsed ? <FaUser className="text-xl" /> : "Profile"}
              </Link>
            </li>
            <li
              className={`cursor-pointer ${activeTab === "settings" ? "bg-blue-600" : "hover:bg-gray-300"} p-3 rounded-lg`}
              onClick={() => handleTabClick("settings")}
            >
              <Link
                to="/auth/settings"
                className={`block ${isCollapsed ? "text-center" : ""}`}
              >
                {isCollapsed ? <FaCogs className="text-xl" /> : "Settings"}
              </Link>
            </li>
            <li
              className={`cursor-pointer ${activeTab === "security" ? "bg-blue-600" : "hover:bg-gray-300"} p-3 rounded-lg`}
              onClick={() => handleTabClick("security")}
            >
              <Link
                to="/auth/security"
                className={`block ${isCollapsed ? "text-center" : ""}`}
              >
                {isCollapsed ? <FaLock className="text-xl" /> : "Security"}
              </Link>
            </li>
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
