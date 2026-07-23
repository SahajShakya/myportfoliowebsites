import { motion } from "framer-motion";
import { fadeIn } from "../../../utils/motion";
import React from "react";
import { Tilt } from "react-tilt";
import { Link } from "react-router-dom";

const AcademicProjectCard = ({
  index,
  name,
  description,
  tags,
  source_code_link,
  icons,
  route,
}) => {
  const imageUrl = typeof icons === "string" ? icons : icons?.url || "";

  return (
    <motion.div variants={fadeIn("up", "spring", index * 0.5, 0.75)} className="w-full">
      <Tilt
        options={{ max: 45, scale: 1, speed: 450 }}
        className="bg-tertiary p-5 rounded-2xl w-full h-[450px] flex flex-col"
      >
        <Link to={`/${route}/${index}`} className="flex flex-col h-full">
          <div className="relative w-full h-[220px] flex-shrink-0">
            {imageUrl && (
              <img
                src={imageUrl}
                alt="project_image"
                className="w-full h-full object-cover rounded-2xl"
              />
            )}
            <div className="absolute inset-0 flex justify-end m-3 card-img_hover">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(source_code_link, "_blank");
                }}
                className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-4 flex-grow">
            <h3 className="text-black font-bold text-[20px] line-clamp-2">{name}</h3>
            <p className="mt-2 text-secondary text-[14px] line-clamp-3">
              {description}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags && tags.map((tag) => (
              <p
                key={`${name}-${typeof tag === "string" ? tag : tag.name}`}
                className="text-[12px] text-[#6c5ce7]"
              >
                #{typeof tag === "string" ? tag : tag.name}
              </p>
            ))}
          </div>
        </Link>
      </Tilt>
    </motion.div>
  );
};

export default AcademicProjectCard;
