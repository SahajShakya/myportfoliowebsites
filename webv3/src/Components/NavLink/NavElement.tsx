// NavElement.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import NavLink from "./NavLink"; // Import the NavLink component
import Modal from "../UI/Modal/Modal"; // Import the Modal component
import FlyoutLink from "./FlyoutLink"; // Import FlyoutLink
// import { getAuth, signOut } from "firebase/auth";
import ProfileUpdate from "../UI/ProfileUpdate/ProfileUpdate";
import { useUser } from "../../context/UserContext";
import PasswordUpdate from "../UI/PasswordUpdate/PasswordUpdate";

type NavProps = {
  token: string | null;
  path?: string;
  pathName: string;
  logo?: string;
};

const NavElement = ({ token, path, pathName, logo }: NavProps) => {
  const location = useLocation();
  const [modalContent, setModalContent] = useState<
    "update" | "logout" | "updatePassword" | null
  >(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isCounting, setIsCounting] = useState(false);
  const { handleLogout } = useUser();

  const navigate = useNavigate();

  const handleOpenModal = (type: "update" | "logout" | "updatePassword") => {
    setModalContent(type);
    setDropdownVisible(false); // Close the dropdown when a modal is triggered
  };

  const handleCloseModal = () => {
    setModalContent(null);
  };

  const handleLogoutUser = () => {
    // const auth = getAuth();
    // signOut(auth);
    // localStorage.removeItem("authToken");
    // localStorage.removeItem("tokenExpiry");
    // localStorage.removeItem("refreshToken");
    // addData({
    //   name: "",
    //   email: "",
    //   roleId: "",
    //   role: "",
    // });
    // localStorage.removeItem("user");
    console.log("Logout called inside NavElement");
    handleLogout();
    navigate("/login");
    handleCloseModal();
  };

  return (
    <nav className="p-8">
      <ul className="flex gap-12">
        {!token ? (
          <NavLink
            path={`/${path}`}
            name={pathName}
            isActive={location.pathname === `/${path}`}
            location={location.pathname}
            logo={logo}
          />
        ) : (
          <>
            {/* User Dropdown */}
            <FlyoutLink
              href="#"
              setDropdownVisible={setDropdownVisible}
              handleOpenModal={handleOpenModal}
            >
              <FiUser size={24} className="cursor-pointer text-gray-600" />
            </FlyoutLink>
          </>
        )}
      </ul>

      {/* Modals */}
      {modalContent === "update" && (
        <Modal
          title="Update Profile"
          onClose={() => {
            // Prevent closing the modal when the countdown is active
            if (!isCounting) {
              handleCloseModal();
              setIsCounting(false);
            }
          }}
        >
          <ProfileUpdate
            handleCloseModal={handleCloseModal}
            isCounting={isCounting}
            setIsCounting={setIsCounting}
          />
        </Modal>
      )}

      {/* Modals */}
      {modalContent === "updatePassword" && (
        <Modal title="Update Password" onClose={handleCloseModal}>
          <PasswordUpdate handleCloseModal={handleCloseModal} />
        </Modal>
      )}

      {modalContent === "logout" && (
        <Modal title="Logout" onClose={handleCloseModal}>
          <>
            <p>Are you sure you want to logout</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogoutUser}
                className="mt-4 p-2 bg-blue-500 text-white rounded-md w-20"
              >
                Yes
              </button>
              <button
                onClick={handleCloseModal}
                className="mt-4 p-2 bg-red-500 text-white rounded-md w-20"
              >
                No
              </button>
            </div>
          </>
        </Modal>
      )}
    </nav>
  );
};

export default NavElement;
