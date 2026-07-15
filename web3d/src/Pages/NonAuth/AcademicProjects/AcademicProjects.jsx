import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import AcademicProjectCard from "../../../Components/UI/AcademicProjectCard/AcademicProjectCard";
import api from "../../../api/client";

const AcademicProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get("/academic_projects");
        setProjects(data.data || []);
      } catch (error) {
        console.error("Error fetching academic projects:", error);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6">
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Academic Works</p>
        <h2 className={styles.sectionHeadText}>Academic Projects.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        Following projects showcases my research and academic works.
      </motion.p>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
  );
};

export default AcademicProjects;
