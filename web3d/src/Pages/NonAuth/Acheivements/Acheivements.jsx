import { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import SectionWrapper from "../../../hoc/SectionWrapper";
import { db } from "../../../firebase/firebase";
import ProjectCard from "../../../Components/UI/ProjectCard/ProjectCard"; // Make sure this component exists

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      const querySnapshot = await getDocs(collection(db, "achievements"));
      // const achievementsList = querySnapshot.docs.map((doc) => {
      //   doc.id, // Get the document ID
      //     doc.data();
      // });

      const achievementsList = querySnapshot.docs.map((doc) => ({
        id: doc.id, // Get the document ID
        ...doc.data(), // Get the rest of the data
      }));

      // Sort achievements by date (adjust the field name if necessary)
      const sortedAchievements = achievementsList.sort(
        (a, b) => new Date(b.date) - new Date(a.date) // Assuming 'date' field exists
      );

      setAchievements(sortedAchievements);
      setLoading(false);
    };

    fetchAchievements();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6">
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>My Achievements</p>
        <h2 className={styles.sectionHeadText}>Achievements.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        These achievements showcase milestones and recognitions in my career.
        Each achievement is briefly described with links to relevant resources.
      </motion.p>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {achievements.map((achievement, index) => (
          <ProjectCard
            key={achievement.id}
            index={achievement.id}
            {...achievement}
            route="achievements"
          />
        ))}
      </div>
    </div>
  );
};

export default Achievements;
