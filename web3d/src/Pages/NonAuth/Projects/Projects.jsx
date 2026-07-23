import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import ProjectCard from "../../../Components/UI/ProjectCard/ProjectCard";
import { useProjectsQuery } from "../../../Hooks/options/useProjectsQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";

const Projects = () => {
  const { data: projectsData, isLoading } = useProjectsQuery();
  const { data: bgImage } = useSectionBgQuery("projects_bg_image");
  const projects = projectsData || [];

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background: bgImage
          ? `url(${bgImage}) center/cover no-repeat fixed`
          : "#0a0a1a",
      }}
    >
      {bgImage && <div className="fixed inset-0 -z-0" />}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div variants={textVariant()}>
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase text-center mb-1">My work</p>
          <h2 className="text-white font-black text-4xl sm:text-5xl md:text-6xl text-center">Projects.</h2>
        </motion.div>

        <div className="w-full flex">
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
        </div>

        {isLoading ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">No projects found yet.</p>
        ) : (
          <div className="mt-16 flex flex-wrap gap-6 justify-center">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                index={project?.id}
                {...project}
                route={"projects"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;