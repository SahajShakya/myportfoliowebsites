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

  console.log(projects);

  // Fetch projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectsList = querySnapshot.docs.map((doc) => doc.data());
      setProjects(projectsList);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <p>Loading...</p>; // You can customize this loading state
  }

  return (
    <>
      <div className="ml-10">
        <motion.div variants={textVariant()}>
          <p className={`${styles.sectionSubText}`}>My work</p>
          <h2 className={`${styles.sectionHeadText}`}>Projects.</h2>
        </motion.div>

        <div className="w-full flex">
          <motion.p
            variants={fadeIn("", "", 0.1, 1)}
            className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
          >
            Following projects showcase my skills and experience through
            real-world examples of my work. Each project is briefly described
            with links to code repositories and live demos in it. It reflects my
            ability to solve complex problems, work with different technologies,
            and manage projects effectively.
          </motion.p>
        </div>

        <div className="mt-20 flex flex-wrap gap-7">
          {projects.map((project, index) => (
            // Make sure to use a unique key value
            <ProjectCard
              key={project.description}
              index={project.id}
              {...project}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Projects;
