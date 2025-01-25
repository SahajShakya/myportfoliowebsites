import Navbar from "./Navbar2";
import { motion } from "framer-motion";
import NavElement from "../NavLink/NavElement";
import logo from "../../../public/vite.svg";

const Nav = () => {
  const token = localStorage.getItem("authToken");
  const tabs = [
    { name: "Home", hasDropdown: false, linkTo: "/" },
    {
      name: "Projects",
      hasDropdown: true,
      dropdownOptions: [
        { label: "Option 1", to: "/option-1" },
        { label: "Option 2", to: "/option-2" },
        { label: "Option 4", to: "/option-3" },
      ],
    },
    {
      name: "Achievements",
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
      className="flex items-center justify-between  h-[20px] "
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Pass logo only to NavElement */}
      <NavElement token={null} logo={logo} pathName="/" />
      <div className="flex-1 mx-8">
        <Navbar tabs={tabs} token={token} />
      </div>
      <div  className="flex gap-12 hidden md:flex">
      <NavElement token={token} path="https://engineeringstudymaterials.com/" pathName="Materials" />
      </div>
    </motion.div>
  );
};

export default Nav;
