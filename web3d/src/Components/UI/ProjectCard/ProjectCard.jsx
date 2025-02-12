import { motion } from "framer-motion";
import { fadeIn } from "../../../utils/motion";
import React from "react";
import { Tilt } from "react-tilt";
import { Link } from "react-router-dom"; // Import Link for routing

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  image,
  source_code_link,
  icons,
  link, // Assuming link is the route you want to navigate to
}) => {
  return (
    <motion.div variants={fadeIn("up", "spring", index * 0.5, 0.75)}>
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full"
      >
        <Link to={"/${index}"}>
          {" "}
          {/* Wrap the card with Link to navigate to the specified route */}
          <div className="relative w-full h-[230px]">
            <img
              src={icons.publicUrl}
              alt="project_image"
              className="w-full h-full object-cover rounded-2xl"
            />

            <div className="absolute inset-0 flex justify-end m-3 card-img_hover">
              <div
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the click from triggering the Link
                  window.open(source_code_link, "_blank");
                }}
                className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
              >
                <img
                  src={icons.publicURL}
                  alt="source code"
                  className="w-1/2 h-1/2 object-contain"
                />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-white font-bold text-[24px]">{name}</h3>
            <p className="mt-2 text-secondary text-[14px]">{description}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <p
                key={`${name}-${tag.name}`}
                className="text-[14px] text-[#6c5ce7]" // Using a static color code
              >
                #{tag}
              </p>
            ))}
          </div>
        </Link>
      </Tilt>
    </motion.div>
  );
};

export default ProjectCard;
