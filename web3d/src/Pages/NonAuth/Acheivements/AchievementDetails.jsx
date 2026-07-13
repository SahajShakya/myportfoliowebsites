import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import { useParams } from "react-router-dom";
import { Tilt } from "react-tilt";
import React from "react";
import api from "../../../api/client";

const AchievementCard = ({ index, title, image }) => {
  return (
    <motion.div variants={fadeIn("up", "spring", index * 0.5, 0.75)} className="w-full">
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className="bg-tertiary p-5 rounded-2xl w-full h-[450px] flex flex-col"
      >
        <div className="relative w-full h-[220px] flex-shrink-0">
          <img
            src={image}
            alt="achievement_image"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
        <div className="mt-4 flex-grow flex items-center justify-center">
          <h3
            className="text-black font-bold text-[20px] text-center line-clamp-6"
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
      try {
        const data = await api.get(`/achievements/${id}/details`);
        setAchievementDetails(data.data || []);
      } catch (error) {
        console.error("Error fetching achievement details:", error);
      }
      setLoading(false);
    };

    fetchAchievementDetails();
  }, [id]);

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
        Some Images
      </motion.p>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {achievementDetails.map((achievement) => {
          const icons = Array.isArray(achievement.icons) ? achievement.icons : [];
          return (
            <AchievementCard
              key={achievement.id}
              index={achievement.id}
              title={achievement.contents}
              image={icons[0]}
            />
          );
        })}
      </div>
    </div>
  );
};

export default AchievementDetails;
