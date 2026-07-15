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
  const imageUrl = typeof icons === "string" ? icons : icons?.publicUrl || "";

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
                <img
                  src={icons.publicURL}
                  alt="source code"
                  className="w-[15%] aspect-[3/2] object-contain mix-blend-color-burn rounded-lg"
                />
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
                key={`${name}-${tag}`}
                className="text-[12px] text-[#6c5ce7]"
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

export default AcademicProjectCard;
