import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import AcademicProjectCard from "../../../Components/UI/AcademicProjectCard/AcademicProjectCard";
import { useAcademicProjectsQuery } from "../../../Hooks/options/useAcademicProjectsQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";

const AcademicProjects = () => {
  const { data: projectsData, isLoading } = useAcademicProjectsQuery();
  const { data: bgImage } = useSectionBgQuery("academic_projects_bg_image");
  const projects = projectsData || [];

  if (isLoading) {
    return <p>Loading...</p>;
  }

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
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase text-center mb-1">Academic Works</p>
          <h2 className="text-white font-black text-4xl sm:text-5xl md:text-6xl text-center">Academic Projects.</h2>
        </motion.div>

        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 text-white/70 text-[17px] max-w-3xl leading-[30px] mx-auto text-center"
        >
          Following projects showcases my research and academic works.
        </motion.p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <AcademicProjectCard
              key={project.id}
              index={project.id}
              {...project}
              route="academic-projects"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AcademicProjects;