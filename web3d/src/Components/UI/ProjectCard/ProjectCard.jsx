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
  route,
}) => {
  return (
    <motion.div variants={fadeIn("up", "spring", index * 0.5, 0.75)}>
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full h-[400px]" // Fixed height and width for card
      >
        <Link to={`/${route}/${index}`}>
          <div className="relative w-full h-[240px]">
            {/* Fixed size image container */}
            <img
              src={icons.publicUrl}
              alt="project_image"
              className="w-full h-full object-cover rounded-2xl" // Ensure image fits the container
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
                  className="w-[15%] aspect-[3/2] object-contain mix-blend-color-burn rounded-lg"
                />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <h3 className="text-black font-bold text-[24px]">{name}</h3>
            {/* Truncate the description to 2 lines */}
            <p className="mt-2 text-secondary text-[14px] line-clamp-2">
              {description}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <p
                key={`${name}-${tag.name}`}
                className="text-[14px] text-[#6c5ce7]"
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
