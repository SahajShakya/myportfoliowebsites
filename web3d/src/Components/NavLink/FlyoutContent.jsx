import React from "react";


const FlyoutContent = ({
  setDropdownVisible,
  handleOpenModal,
}) => {
  return (
    <ul className="w-56">
      {" "}
      {/* Set a fixed width for the dropdown */}
      <li className="py-1">
        <button
          onClick={() => {
            setDropdownVisible(false);
            handleOpenModal("update");
          }}
          className="block text-sm hover:underline w-full text-left"
        >
          Update Profile
        </button>
      </li>
      <li className="py-1">
        <button
          onClick={() => {
            setDropdownVisible(false);
            handleOpenModal("updatePassword");
          }}
          className="block text-sm hover:underline w-full text-left"
        >
          Update Password
        </button>
      </li>
      <li className="py-1">
        <button
          onClick={() => {
            setDropdownVisible(false);
            handleOpenModal("logout");
          }}
          className="block text-sm hover:underline w-full text-left"
        >
          Logout
        </button>
      </li>
    </ul>
  );
};

export default FlyoutContent;
