import { useState } from "react";
import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import BentoProjectCard from "../../../Components/UI/BentoProjectCard/BentoProjectCard";
import { useProjectsQuery } from "../../../Hooks/options/useProjectsQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "workproject", label: "Work" },
  { key: "academicsproject", label: "Academic" },
];

const Projects = () => {
  const [filter, setFilter] = useState("all");
  const { data: projectsData, isLoading } = useProjectsQuery();
  const { data: bgImage } = useSectionBgQuery("projects_bg_image");
  const projects = projectsData || [];

  const filteredProjects =
    filter === "all" ? projects : projects.filter((p) => (p.category || "workproject") === filter);

  return (
    <div className="relative w-full min-h-screen">
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0a0a1a",
        }}
      />
      {bgImage && <div className="absolute inset-0 bg-black/30 -z-[5]" />}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div variants={textVariant()}>
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase text-center mb-1">
            My work
          </p>
          <h2 className="text-white font-black text-4xl sm:text-5xl md:text-6xl text-center">
            Projects.
          </h2>
        </motion.div>

        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 text-white/70 text-[17px] max-w-3xl leading-[30px] mx-auto text-center"
        >
          Following projects showcase my skills and experience through real-world
          examples of my work. Each project is briefly described with links to
          code repositories and live demos in it. It reflects my ability to solve
          complex problems, work with different technologies, and manage projects
          effectively.
        </motion.p>

        <motion.div
          variants={fadeIn("", "", 0.2, 1)}
          className="flex items-center justify-center gap-2 mt-8 flex-wrap"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                filter === f.key
                  ? "bg-[#6c5ce7] text-white border-[#6c5ce7]"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {isLoading ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">Loading...</p>
        ) : filteredProjects.length === 0 ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">
            No projects found yet.
          </p>
        ) : (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 auto-rows-[200px]">
            {filteredProjects.map((project, index) => (
              <BentoProjectCard
                key={project.id}
                project={project}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
