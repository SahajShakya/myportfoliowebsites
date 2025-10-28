import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import SectionWrapper from "../../../hoc/SectionWrapper";
import { db } from "../../../firebase/firebase";
import ProjectCard from "../../../Components/UI/ProjectCard/ProjectCard";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectsList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Get the document ID
        ...doc.data(), // Get the rest of the data
      }));

      // Sort projects by startDate
      const sortedProjects = projectsList.sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      );

      setProjects(sortedProjects);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }
  // console.log(projects);
  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6">
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>My work</p>
        <h2 className={styles.sectionHeadText}>Projects.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        Following projects showcase my skills and experience through real-world
        examples of my work. Each project is briefly described with links to
        code repositories and live demos in it. It reflects my ability to solve
        complex problems, work with different technologies, and manage projects
        effectively.
      </motion.p>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            index={project?.id}
            {...project}
            route={"projects"}
          />
        ))}
      </div>
    </div>
  );
};

export default Projects;
