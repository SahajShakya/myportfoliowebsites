import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import SectionWrapper from "../../../hoc/SectionWrapper";
import ProjectCard from "../../../Components/UI/ProjectCard/ProjectCard";
import { useAchievementsQuery } from "../../../Hooks/options/useAchievementsQuery";

const Achievements = () => {
  const { data: achievementsData, isLoading } = useAchievementsQuery();
  const achievements = achievementsData || [];

  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>My Achievements</p>
        <h2 className={styles.sectionHeadText}>Achievements.</h2>
      </motion.div>

      <div className="w-full flex">
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
        >
          These achievements showcase milestones and recognitions in my career.
          Each achievement is briefly described with links to relevant resources.
        </motion.p>
      </div>

      {isLoading ? (
        <p className="mt-20 text-secondary text-[16px]">Loading...</p>
      ) : achievements.length === 0 ? (
        <p className="mt-20 text-secondary text-[16px]">No achievements found yet.</p>
      ) : (
        <div className="mt-20 flex flex-wrap gap-7">
          {achievements.map((achievement) => (
            <ProjectCard
              key={achievement.id}
              index={achievement.id}
              {...achievement}
              route="achievements"
            />
          ))}
        </div>
      )}
    </>
  );
};

export default SectionWrapper(Achievements, "achievements");