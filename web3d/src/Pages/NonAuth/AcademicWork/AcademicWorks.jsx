import React from "react";
import { Tilt } from "react-tilt";
import { motion } from "framer-motion";

import { styles } from "../../../styles";
import github from "./github.png";
import { SectionWrapper } from "../../../hoc";

import { fadeIn, textVariant } from "../../../utils/motion";
import { useAcademicProjectsQuery } from "../../../Hooks/options/useAcademicProjectsQuery";

const tagColors = ["blue-text-gradient", "green-text-gradient", "pink-text-gradient"];

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  image,
  source_code_link,
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
        <div className="relative w-full h-[230px]">
          <img
            src={image}
            alt="project_image"
            className="w-full h-full object-cover rounded-2xl"
          />

          <div className="absolute inset-0 flex justify-end m-3 card-img_hover">
            <div
              onClick={() => window.open(source_code_link, "_blank")}
              className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
            >
              <img
                src={github}
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
          {tags.map((tag, i) => (
            <p
              key={`${name}-${tag}`}
              className={`text-[14px] ${tagColors[i % tagColors.length]}`}
            >
              #{tag}
            </p>
          ))}
        </div>
      </Tilt>
    </motion.div>
  );
};

const AcademicWorks = () => {
  const { data: projects = [], isLoading: loading } = useAcademicProjectsQuery();

  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} `}>My work</p>
        <h2 className={`${styles.sectionHeadText}`}>Academic Works.</h2>
      </motion.div>

      <div className="w-full flex">
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
        >
          Following projects showcases my research and academic works
        </motion.p>
      </div>

      <div className="mt-20 flex flex-wrap gap-7">
        {loading ? (
          <p className="text-secondary">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-secondary text-[16px]">No academic projects found yet.</p>
        ) : (
          projects.map((project, index) => (
            <ProjectCard
              key={`project-${project.id}`}
              index={index}
              name={project.name}
              description={project.description}
              tags={project.tags || []}
              image={project.icons || ""}
              source_code_link={project.source_code_link || "#"}
            />
          ))
        )}
      </div>
    </>
  );
};

export default SectionWrapper(AcademicWorks, "academicworks");
