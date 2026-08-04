/* eslint-disable react/prop-types */
import { motion } from "framer-motion";
import { fadeIn } from "../../../utils/motion";
import { Link } from "react-router-dom";
import MediaRenderer from "../MediaRenderer/MediaRenderer";

const stripHtml = (html) =>
  (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const BentoProjectCard = ({ project, index, className = "", route = "/projects", badge = null }) => {
  const cover =
    typeof project.icons?.[0] === "string"
      ? project.icons[0]
      : project.icons?.[0]?.icon_url || project.background_image_url || "";

  const tags = project.tags || [];
  const category = project.category || "workproject";
  const categoryLabel = badge || (category === "academicsproject" ? "Academic" : "Work");

  return (
    <motion.div
      variants={fadeIn("up", "spring", (index % 8) * 0.08, 0.6)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className={`${className} h-full`}
    >
      <Link
        to={`${route}/${project.id}`}
        className="group relative block w-full h-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
      >
        {/* Cover media */}
        <div className="absolute inset-0 overflow-hidden">
          {cover ? (
            <MediaRenderer
              src={cover}
              alt={project.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#6c5ce7] to-purple-700" />
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10 transition-opacity duration-500 group-hover:opacity-95" />

        {/* Hover ring */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl transition-colors duration-500 group-hover:ring-[#6c5ce7]/60" />

        {/* Category badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full backdrop-blur-sm border ${
              category === "academicsproject"
                ? "bg-purple-500/80 text-white border-purple-300/40"
                : "bg-blue-500/80 text-white border-blue-300/40"
            }`}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="transition-transform duration-500 ease-out group-hover:-translate-y-1">
            <h3 className="mb-1 text-lg font-bold text-white line-clamp-2 sm:text-xl">
              {project.name}
            </h3>
            {project.description && (
              <p className="max-w-[95%] text-xs text-white/60 line-clamp-2 sm:text-sm">
                {stripHtml(project.description)}
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[10px] rounded-full bg-white/10 text-white/70 border border-white/10"
                  >
                    #{typeof tag === "string" ? tag : tag.name}
                  </span>
                ))}
              </div>
            )}
            <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#6c5ce7] opacity-0 translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              View Details →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default BentoProjectCard;
