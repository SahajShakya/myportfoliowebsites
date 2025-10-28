import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import SectionWrapper from "../../../hoc/SectionWrapper";
import { db } from "../../../firebase/firebase";
import { useParams } from "react-router-dom"; // Import useParams to get the dynamic URL params
import { Tilt } from "react-tilt";

import React from "react";

const ProjectCard = ({ index, name, image }) => {
  return (
    <motion.div variants={fadeIn("up", "spring", index * 0.5, 0.75)} className="w-full">
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className="bg-tertiary p-5 rounded-2xl w-full h-[450px] flex flex-col" // Consistent height across all cards
      >
        <div className="relative w-full h-[220px] flex-shrink-0">
          {/* Fixed size image container */}
          <img
            src={image} // Assuming icons is an array with the first icon having a publicUrl
            alt="project_image"
            className="w-full h-full object-cover rounded-2xl" // Ensure image fits the container
          />
        </div>
        <div className="mt-4 flex-grow flex items-center justify-center">
          <h3
            className="text-black font-bold text-[20px] text-center line-clamp-6"
            dangerouslySetInnerHTML={{ __html: name }} // Render raw HTML inside <h3>
          />
        </div>
      </Tilt>
    </motion.div>
  );
};

const ProjectDetails = () => {
  const [projectDetails, setProjectDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); // Get the project ID from the URL

  useEffect(() => {
    const fetchProjectDetails = async () => {
      const querySnapshot = await getDocs(collection(db, "projectDetails"));
      const projectDetailsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // If an ID is provided, filter the projects based on the URL param (id)
      const filteredProjectDetails = id
        ? projectDetailsList.filter((project) => project.project_id === id)
        : projectDetailsList;

      // Sort if needed, for example based on project_id or other field
      const sortedProjects = filteredProjectDetails.sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      );

      setProjectDetails(sortedProjects);
      setLoading(false);
    };

    fetchProjectDetails();
  }, [id]); // Re-fetch when the ID changes

  if (loading) {
    return <p>Loading...</p>;
  }

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
        Some Images
      </motion.p>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projectDetails.map((project) => (
          <ProjectCard
            key={project.id} // Use the project's ID as key
            index={project.id}
            name={project.contents} // Assuming the contents is the project name/description
            // description={project.contents}
            // tags={[]} // If there are tags, you can pass them here
            image={project.icons && project.icons[0]?.publicUrl} // Assuming icons is an array
            // source_code_link={""} // Add the source code link if you have one in the data
            // icons={project.icons} // Pass icons data to ProjectCard
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectDetails;
