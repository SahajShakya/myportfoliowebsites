import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import BentoProjectCard from "../../../Components/UI/BentoProjectCard/BentoProjectCard";
import { useAchievementsQuery } from "../../../Hooks/options/useAchievementsQuery";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";

const Achievements = () => {
  const { data: achievementsData, isLoading } = useAchievementsQuery();
  const { data: bgImage } = useSectionBgQuery("achievements_bg_image");
  const achievements = achievementsData || [];

  return (
    <div
      className="relative w-full min-h-screen"
    >
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: bgImage ? `url(${bgImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0a0a1a",
        }}
      />
      {bgImage && <div className="absolute inset-0 bg-black/30 -z-[5]" />}
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
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 auto-rows-[200px]">
            {achievements.map((achievement, index) => (
              <BentoProjectCard
                key={achievement.id}
                project={achievement}
                index={index}
                route="achievements"
                badge="Achievement"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;