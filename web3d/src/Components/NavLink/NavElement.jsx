import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import NavLink from "./NavLink";
import Modal from "../UI/Modal/Modal";
import FlyoutLink from "./FlyoutLink";
import ProfileUpdate from "../UI/ProfileUpdate/ProfileUpdate";
import { useAuthContext } from "../../context/AuthContext";
import PasswordUpdate from "../UI/PasswordUpdate/PasswordUpdate";

const NavElement = ({ token, path, pathName, logo }) => {
  const location = useLocation();
  const [modalContent, setModalContent] = useState(null);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isCounting, setIsCounting] = useState(false);
  const { logout } = useAuthContext();
  const navigate = useNavigate();

  const handleOpenModal = (type) => {
    setModalContent(type);
    setDropdownVisible(false);
  };

  const handleCloseModal = () => {
    setModalContent(null);
  };

  const handleLogoutUser = async () => {
    await logout();
    navigate("/vitra");
    handleCloseModal();
  };

  return (
    <nav className="p-8 relative z-50">
      <ul className="flex gap-12">
        {!token ? (
          path ? (
            <NavLink
              path={Array.isArray(path) ? path[0] : path}
              name={pathName}
              isActive={location.pathname === (Array.isArray(path) ? path[0] : path)}
              location={location.pathname}
              logo={logo}
            />
          ) : null
        ) : path ? (
          <NavLink
            path={Array.isArray(path) ? path[0] : path}
            name={pathName}
            isActive={location.pathname === (Array.isArray(path) ? path[0] : path)}
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

      {createPortal(
        <>
          {modalContent === "update" && (
            <Modal
              title="Update Profile"
              onClose={() => {
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

          {modalContent === "updatePassword" && (
            <Modal title="Update Password" onClose={handleCloseModal}>
              <PasswordUpdate handleCloseModal={handleCloseModal} />
            </Modal>
          )}

          {modalContent === "logout" && (
            <Modal title="Logout" onClose={handleCloseModal} small>
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
        </>,
        document.body
      )}
    </nav>
  );
};

export default NavElement;
