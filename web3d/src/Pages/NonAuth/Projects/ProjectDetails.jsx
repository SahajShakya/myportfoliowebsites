/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import React from "react";
import { privateAgent } from "../../../api/authRequest";
import { routesName } from "../../../constants/routesName";
import ContentSection from "../../../Components/UI/ContentSection/ContentSection";

const ProjectDetails = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await privateAgent.get(routesName.ProjectsRoute({ id }).get);
        const data = response.data;
        setProject(data.data || null);
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
      setLoading(false);
    };

    fetchProjectDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#6c5ce7] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-gray-500">Project not found</p>
        <button
          onClick={() => navigate("/projects")}
          className="text-[#6c5ce7] hover:text-[#5a4bd1] font-semibold text-sm transition-colors"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  const iconUrl =
    typeof project.icons?.[0] === "string"
      ? project.icons[0]
      : project.icons?.[0]?.icon_url || "";

  const primaryLink = project.links?.[0]?.url || project.source_code_link || "";

  const tags = Array.isArray(project.tags) ? project.tags : [];

  let contents = [];
  if (project.contents && Array.isArray(project.contents)) {
    contents = project.contents;
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Fixed background layer */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: project.background_image_url
            ? `url(${project.background_image_url})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0a0a1a",
        }}
      />
      {project.background_image_url && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] -z-[5]" />
      )}

      <div className="relative z-10">
        {/* Hero Banner */}
        <div className="relative w-full overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute bg-white rounded-full top-10 left-10 w-72 h-72 blur-3xl" />
            <div className="absolute bg-white rounded-full bottom-10 right-10 w-96 h-96 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-6xl px-4 pt-20 pb-3 mx-auto sm:px-6 lg:px-8 sm:pt-24 sm:pb-4 lg:pt-28 lg:pb-5">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => navigate("/projects")}
              className="flex items-center gap-2 mb-3 text-sm font-medium transition-colors text-white/80 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Projects
            </motion.button>

            <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-8">
              {/* Column 1 — icon */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center flex-shrink-0 gap-2"
              >
                <div className="flex items-center justify-center border-2 rounded-full shadow-xl w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm border-white/40">
                  {iconUrl ? (
                    <img src={iconUrl} alt={project.name} className="w-[75%] h-[75%] object-contain rounded-full" />
                  ) : (
                    <span className="text-xl font-black text-white">{project.name?.charAt(0) || "P"}</span>
                  )}
                </div>
              </motion.div>

              {/* Column 2 — name, tags */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col justify-center flex-shrink-0"
              >
                <p className="text-white/60 text-xs font-medium tracking-wider uppercase mb-0.5">
                  Project
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1.5">
                  {project.name}
                </h1>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 text-[11px] rounded-full bg-white/20 text-white/80 backdrop-blur-sm"
                      >
                        #{typeof tag === "string" ? tag : tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Column 3 — description + button */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col flex-1 min-w-0 gap-3"
              >
                {project.description && (
                  <div
                    className="text-sm leading-relaxed text-white"
                    dangerouslySetInnerHTML={{ __html: project.description }}
                  />
                )}
                {primaryLink && (
                  <a
                    href={primaryLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center self-start gap-2 px-5 py-2 text-sm font-semibold text-white transition-all duration-300 rounded-full hover:text-white/80 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                  >
                    Visit Link
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Details */}
        {project.detail && (
          <div className="relative w-full px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-3 mb-6"
              >
                <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#6c5ce7] to-purple-500" />
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  About the Project
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-10"
              >
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#6c5ce7]/60 to-transparent" />
                <div
                  className="rich-content"
                  dangerouslySetInnerHTML={{ __html: project.detail }}
                />
              </motion.div>
            </div>
          </div>
        )}

        {/* Content Sections — Timeline */}
        {contents.length > 0 && (
          <div className="relative w-full px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
            <div className="ml-5 sm:ml-8">
              {contents.map((section, index) => (
                <ContentSection key={section.id || index} section={section} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
