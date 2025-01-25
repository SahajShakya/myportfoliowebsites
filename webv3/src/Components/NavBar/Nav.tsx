import Navbar from "./Navbar2";
// import { FiUser } from "react-icons/fi"; // React Icon for user
import { motion } from "framer-motion"; // Import Framer Motion for animations
// import AnimatedButton1 from "../Button/AnimatedButton1";
// import AnimatedButton2 from "../Button/AnimatedButton2";
// import SimpleButton from "../Button/SimpleButton";
// import Card from "../UI/Card/Card"; // Import the Card component
import NavElement from "../NavLink/NavElement";
import logo from "../../../public/vite.svg";

const Nav = () => {
  // Check if the token exists (this is a simple example using localStorage)
  const token = localStorage.getItem("authToken");
  const tabs = [
    { name: "Home", hasDropdown: false, linkTo: "/" },
    {
      name: "Facitlies",
      hasDropdown: true,
      dropdownOptions: [
        { label: "Option 1", to: "/option-1" },
        { label: "Option 2", to: "/option-2" },
        { label: "Option 4", to: "/option-3" },
      ],
    },
    {
      name: "Test",
      hasDropdown: true,
      dropdownOptions: [
        { label: "Option 1", to: "/option-1" },
        { label: "Option 2", to: "/option-2" },
        { label: "Option 3", to: "/option-3" },
      ],
    },
    { name: "About Us", hasDropdown: false, linkTo: "/blog" },
    { name: "Contact", hasDropdown: false, linkTo: "/contact" },
  ];
  return (
    <motion.div
      className="flex items-center justify-between w-full p-4 bg-gray-200 shadow-md"
      initial={{ opacity: 0, y: -20 }} // Start from invisible and slightly up
      animate={{ opacity: 1, y: 0 }} // Fade in and move to its normal position
      transition={{ duration: 0.5, ease: "easeOut" }} // Smooth animation
    >
      {/* Card for Logo */}
      {/* <Card>
        <AnimatedButton2 to="/" text="Logo" />
      </Card> */}

      <NavElement token={null} logo={logo} pathName="/" />

      {/* Navbar takes up remaining space */}
      <div className="flex-1 mx-8">
        <Navbar tabs={tabs} />
      </div>

      {/* Conditional rendering of user icon or login link */}
      {/* <motion.div
        className="flex items-center px-4"
        initial={{ opacity: 0 }} // Start with invisible
        animate={{ opacity: 1 }} // Fade in on load
        transition={{ delay: 0.2, duration: 0.5 }} // Delay the icon/login visibility for smooth effect
      >
        {token ? (
          // If token exists, show the user icon
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0 }} // Start invisible
            animate={{ opacity: 1 }} // Fade in when token exists
            transition={{ delay: 0.3, duration: 0.5 }} // Slight delay for better effect
          >
            <FiUser size={24} className="text-gray-600" />
          </motion.div>
        ) : (
          // If no token, show the login text
          <motion.div
            className="flex justify-center items-center"
            whileHover={{ scale: 1.1, y: -5 }} // Slight scale up and upward movement on hover
            whileTap={{ scale: 0.95 }} // Slight scale down on click
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card>
              <SimpleButton to="/login" text="Login" />
            </Card>
          </motion.div>
        )}
      </motion.div> */}
      <NavElement token={token} path="login" pathName="login" />
    </motion.div>
  );
};

export default Nav;
