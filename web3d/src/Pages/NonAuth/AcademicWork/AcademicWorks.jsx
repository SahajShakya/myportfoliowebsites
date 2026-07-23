import React from "react";
import { motion } from "framer-motion";
import { fadeIn, textVariant } from "../../../utils/motion";
import { useAcademicProjectsQuery } from "../../../Hooks/options/useAcademicProjectsQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";
import ProjectCard from "../../../Components/UI/ProjectCard/ProjectCard";

const AcademicWorks = () => {
  const { data: projects = [], isLoading: loading } = useAcademicProjectsQuery();
  const { data: bgImage } = useSectionBgQuery("academic_works_bg_image");

  return (
    <div
      id="academicworks"
      className="w-full min-h-screen"
      style={{
        background: bgImage
          ? `url(${bgImage}) center/cover no-repeat fixed`
          : "#0a0a1a",
      }}
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div variants={textVariant()}>
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase text-center mb-1">My work</p>
          <h2 className="text-white font-black text-4xl sm:text-5xl md:text-6xl text-center">Academic Works.</h2>
        </motion.div>

        <div className="w-full flex">
          <motion.p
            variants={fadeIn("", "", 0.1, 1)}
            className="mt-3 text-white/70 text-[17px] max-w-3xl leading-[30px] mx-auto text-center"
          >
            Following projects showcases my research and academic works
          </motion.p>
        </div>

        {loading ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">No academic projects found yet.</p>
        ) : (
          <div className="mt-16 flex flex-wrap gap-7 justify-center">
            {projects.map((project, index) => (
              <ProjectCard
                key={`project-${project.id}`}
                index={index}
                {...project}
                route="academic_projects"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicWorks;
