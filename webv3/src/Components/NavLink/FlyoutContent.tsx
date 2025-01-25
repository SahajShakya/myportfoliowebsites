import React from "react";

type FlyoutContentProps = {
  setDropdownVisible: React.Dispatch<React.SetStateAction<boolean>>;
  handleOpenModal: (type: "update" | "logout" | "updatePassword") => void;
};

const FlyoutContent = ({
  setDropdownVisible,
  handleOpenModal,
}: FlyoutContentProps) => {
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
