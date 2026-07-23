import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import ProjectCard from "../../../Components/UI/ProjectCard/ProjectCard";
import { useAchievementsQuery } from "../../../Hooks/options/useAchievementsQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";

const Achievements = () => {
  const { data: achievementsData, isLoading } = useAchievementsQuery();
  const { data: bgImage } = useSectionBgQuery("achievements_bg_image");
  const achievements = achievementsData || [];

  return (
    <div
      id="achievements"
      className="w-full min-h-screen"
      style={{
        background: bgImage
          ? `url(${bgImage}) center/cover no-repeat fixed`
          : "#0a0a1a",
      }}
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div variants={textVariant()}>
          <p className="text-white/60 text-sm font-medium tracking-wider uppercase text-center mb-1">My Achievements</p>
          <h2 className="text-white font-black text-4xl sm:text-5xl md:text-6xl text-center">Achievements.</h2>
        </motion.div>

        <div className="w-full flex">
          <motion.p
            variants={fadeIn("", "", 0.1, 1)}
            className="mt-3 text-white/70 text-[17px] max-w-3xl leading-[30px] mx-auto text-center"
          >
            These achievements showcase milestones and recognitions in my career.
            Each achievement is briefly described with links to relevant resources.
          </motion.p>
        </div>

        {isLoading ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">Loading...</p>
        ) : achievements.length === 0 ? (
          <p className="mt-20 text-white/60 text-[16px] text-center">No achievements found yet.</p>
        ) : (
          <div className="mt-16 flex flex-wrap gap-6 justify-center">
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
      </div>
    </div>
  );
};

export default Achievements;