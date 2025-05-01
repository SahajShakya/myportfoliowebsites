import { useState, useEffect } from "react";
import { getDocs, collection } from "firebase/firestore";
import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import { db } from "../../../firebase/firebase";
import { useParams } from "react-router-dom";
import { Tilt } from "react-tilt";
import SectionWrapper from "../../../hoc/SectionWrapper";
import React from "react";

const AchievementCard = ({ index, title, image, description }) => {
  
  return (
    <motion.div variants={fadeIn("up", "spring", index * 0.5, 0.75)}>
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className="bg-tertiary p-5 rounded-2xl w-[320px] h-[400px] mx-auto"
      >
        <div className="relative w-full h-[200px]">
          <img
            src={image}
            alt="achievement_image"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
        <div className="mt-5">
          <h3
            className="text-black font-bold text-[20px] text-center"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        </div>
      </Tilt>
    </motion.div>
  );
};

const AchievementDetails = () => {
  const [achievementDetails, setAchievementDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    const fetchAchievementDetails = async () => {
      const querySnapshot = await getDocs(collection(db, "achievementDetails"));
      const achievementDetailsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const filteredAchievementDetails = id
        ? achievementDetailsList.filter(
            (achievement) => achievement.achievement_id === id
          )
        : achievementDetailsList;

      const sortedAchievements = filteredAchievementDetails.sort(
        (a, b) => new Date(a.dateAchieved) - new Date(b.dateAchieved)
      );

      setAchievementDetails(sortedAchievements);
      setLoading(false);
    };

    fetchAchievementDetails();
  }, [id]);

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="ml-10">
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>My Achievements</p>
        <h2 className={styles.sectionHeadText}>Achievements.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        Some Images
      </motion.p>

      <div className="mt-20 flex flex-wrap justify-center gap-7">
        {achievementDetails.map((achievement, index) => (
          <AchievementCard
            key={achievement.id}
            index={index}
            title={achievement.contents}
            description={achievement.description}
            image={achievement.icons && achievement.icons[0]?.publicUrl}
          />
        ))}
      </div>
    </div>
  );
};

export default SectionWrapper(AchievementDetails, "achievements");
