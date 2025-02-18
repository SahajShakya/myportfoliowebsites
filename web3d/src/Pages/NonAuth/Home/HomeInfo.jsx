import React, { useState, useEffect } from "react";
import Modal from "../../../Components/UI/Modal/Modal";
import {
  FaEnvelope,
  FaPhoneAlt,
  FaLinkedin,
  FaGithub,
  FaYoutube,
  FaInstagram,
} from "react-icons/fa";

import mypic from "../../../assets/mypic.png";

// Array of roles to cycle through
const roles = [
  "Electronics Engineer",
  "Computer Engineer",
  "Full Stack Developer",
  "ML Enthusiast",
  "Computer Vision Enthusiast",
  "AI Engineer",
  "Photographer",
  "Senior Lecturer",
];

// InfoCard Component
const InfoCard = ({ heading, linkText, linkUrl }) => {
  return (
    <div className="flex justify-center mt-20">
      <div
        className="
          sm:text-sm text-center py-2 px-2
          text-white mx-5
          bg-blue-500 rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out
          hover:scale-105 hover:shadow-2xl absolute bottom-2
        "
      >
        <h3 className="mb-4">{heading}</h3>

        {/* Learn More Button inside the card */}
        <a
          href={linkUrl}
          target="_blank"
          className="
            inline-block bg-gradient-to-r from-white to-blue-500 text-blue-700 font-semibold py-2 px-6 rounded-lg
            shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl
            hover:from-blue-500 hover:to-blue-700 hover:text-white mt-4
          "
        >
          {linkText}
        </a>
      </div>
    </div>
  );
};

// Main HomeInfo Component
const HomeInfo = ({ currentStage }) => {
  const [typedText, setTypedText] = useState(""); // Current typed text
  const [isDeleting, setIsDeleting] = useState(false); // Whether we're deleting
  const [roleIndex, setRoleIndex] = useState(0); // Current role in the array
  const [showModal, setShowModal] = useState(false); // Modal visibility state

  // Typing speed and deleting speed in milliseconds
  const typingSpeed = 150; // Speed of typing
  const deletingSpeed = 100; // Speed of deleting
  const pauseTime = 1000; // Pause time after typing out a role

  useEffect(() => {
    const handleTyping = () => {
      if (isDeleting) {
        // Deleting the role character by character
        setTypedText((prev) => prev.slice(0, prev.length - 1));
      } else {
        // Typing the role character by character
        setTypedText((prev) => roles[roleIndex].slice(0, prev.length + 1));
      }
    };

    const timeoutId = setTimeout(
      () => {
        handleTyping();
      },
      isDeleting ? deletingSpeed : typingSpeed
    );

    // Switch to deleting once the role is fully typed
    if (typedText === roles[roleIndex] && !isDeleting) {
      setTimeout(() => {
        setIsDeleting(true); // Start deleting after a pause
      }, pauseTime);
    }

    // Once the text is deleted, move to the next role
    if (typedText === "" && isDeleting) {
      setIsDeleting(false);
      setRoleIndex((prevIndex) => (prevIndex + 1) % roles.length); // Move to the next role in the array
    }

    return () => clearTimeout(timeoutId); // Cleanup on component unmount
  }, [typedText, isDeleting, roleIndex]);

  // Function to open modal
  const openModal = () => {
    setShowModal(true); // Show modal
  };

  // Function to close modal
  const closeModal = () => {
    setShowModal(false); // Close modal
  };

  // Define renderContent for each stage using the InfoCard component
  const renderContent = {
    1: (
      <div
        className="flex justify-center w-full sm:w-[300px] md:w-[200px] mt-20 sm:h-[200px]"
        onClick={() => openModal()}
      >
        <h1
          className="
            sm:text-sm text-base text-center py-2 px-2
            text-white mx-5
            bg-blue-500 rounded-lg shadow-lg transform transition-transform duration-300 ease-in-out
            hover:scale-105 hover:shadow-2xl absolute bottom-1 left-1/2 transform -translate-x-1/2 cursor-pointer
          "
        >
          Hi. I am{" "}
          <span className="font-semibold text-gray-100">Sahaj Shakya</span>
          <br />I am a <span className="font-semibold">{typedText}</span>
          <p className="text-center text-white">
            Bachelors in Electronics and Communication Engineering
          </p>
          <p className="text-center text-white">
            Masters in Computer Engineering
          </p>
        </h1>
      </div>
    ),
    2: (
      <InfoCard
        heading="My academics"
        linkText="Learn More about my academics"
        linkUrl="/academics"
      />
    ),
    3: (
      <InfoCard
        heading="My Journey"
        linkText="Learn More about my journey"
        linkUrl="/journey"
      />
    ),
    4: (
      <InfoCard
        heading="Done Multiple Projects throughout the year"
        linkText="Learn More about my Projects"
        linkUrl="/projects"
      />
    ),
    5: (
      <InfoCard
        heading="I am available for work"
        linkText="Click here to Contact Me"
        linkUrl="/contact"
      />
    ),
    5: (
      <InfoCard
        heading="My Achievements"
        linkText="Click here to see my Achievements"
        linkUrl="/achievements"
      />
    ),
  };

  return (
    <div>
      {/* Conditional rendering based on currentStage */}
      {renderContent[currentStage] || <h1>Stage not found!</h1>}

      {/* Modal */}

      {/* Modal */}
      {showModal && (
        <Modal title="Know Me" onClose={closeModal} fullWidth={true}>
          <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-gradient-to-r from-gray-900 to-black rounded-xl shadow-lg">
            {/* Left Section */}
            <div className="flex items-center">
              {/* Circular Image */}
              <img
                src={mypic} // Ensure mypic is correctly imported
                alt="Sahaj Shakya"
                className="w-16 h-16 md:w-24 md:h-24 rounded-full object-cover"
              />
              {/* Text Section */}
              <div className="ml-4 text-white">
                <div className="font-semibold text-lg md:text-xl">
                  Sahaj Shakya
                </div>
                <div className="flex items-center mt-1 text-sm md:text-base">
                  <FaEnvelope className="mr-2 text-blue-500" />
                  saz.shakya@gmail.com
                </div>
                <div className="flex items-center mt-1 text-sm md:text-base">
                  <FaPhoneAlt className="mr-2 text-green-400" />
                  977-9841194900
                </div>
              </div>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center justify-center space-x-6 text-white mt-6 md:mt-0">
              <a
                href="https://github.com/sahajshakya"
                target="_blank"
                rel="github"
                className="hover:scale-110 transition-transform"
              >
                <FaGithub size={28} />
              </a>
              <a
                href="https://www.linkedin.com/in/sahaj-shakya-98253710a/"
                target="_blank"
                rel="LinkedIn"
                className="hover:scale-110 transition-transform text-blue-400"
              >
                <FaLinkedin size={28} />
              </a>
              <a
                href="https://www.researchgate.net/profile/Sahaj-Shakya"
                target="_blank"
                rel="research gate"
                className="hover:scale-110 transition-transform text-green-500"
              >
                R<span className="text-lg font-bold">G</span>
              </a>
              <a
                href="https://www.youtube.com/@KA1SKZ"
                target="_blank"
                rel="youtube"
                className="hover:scale-110 transition-transform text-red-500"
              >
                <FaYoutube size={28} />
              </a>
              <a
                href="https://www.instagram.com/kai_loves_to_click/"
                target="_blank"
                rel="insta"
                className="hover:scale-110 transition-transform text-pink-500"
              >
                <FaInstagram size={28} />
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HomeInfo;
