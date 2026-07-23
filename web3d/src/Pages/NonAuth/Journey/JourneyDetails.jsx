import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { textVariant, fadeIn } from "../../../utils/motion";
import { styles } from "../../../styles";
import { useParams, useNavigate } from "react-router-dom";
import React from "react";
import { privateAgent } from "../../../api/authRequest";
import { routesName } from "../../../constants/routesName";
import MediaRenderer from "../../../Components/UI/MediaRenderer/MediaRenderer";

const ContentSection = ({ section, index }) => {
  let images = [];
  if (section.image_url) {
    try {
      const parsed = JSON.parse(section.image_url);
      if (Array.isArray(parsed)) {
        images = parsed;
      }
    } catch {
      images = [{ url: section.image_url, title: section.image_description || "" }];
    }
  }

  return (
    <motion.div
      variants={fadeIn("up", "spring", index * 0.15, 0.75)}
      className="bg-white rounded-2xl shadow-md overflow-hidden mb-8 max-w-3xl mx-auto"
    >
      {section.heading && (
        <div className="px-6 pt-5 pb-2">
          <h3 className="text-xl font-bold text-gray-900">{section.heading}</h3>
        </div>
      )}

      {section.content_text && (
        <div className="px-6 pb-3">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {section.content_text}
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-1">
          {images.map((img, imgIdx) => {
            const imgUrl = typeof img === "string" ? img : img.url || "";
            const imgTitle = typeof img === "string" ? "" : img.title || "";
            return (
              <div key={imgIdx}>
                <MediaRenderer
                  src={imgUrl}
                  alt={imgTitle || `Image ${imgIdx + 1}`}
                  className="w-full object-cover max-h-[600px]"
                  controls={false}
                />
                {imgTitle && (
                  <div className="px-6 py-2">
                    <p className="text-xs text-gray-500 italic">{imgTitle}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

const JourneyDetails = () => {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        const response = await privateAgent.get(routesName.JourneyRoute({ id }).get);
        const data = response.data;
        setJourney(data.data || null);
      } catch (error) {
        console.error("Error fetching journey details:", error);
      }
      setLoading(false);
    };
    fetchJourney();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 text-lg mb-4">Journey not found</p>
        <button
          onClick={() => navigate("/journey")}
          className="text-sky-500 hover:text-sky-700 font-medium"
        >
          &larr; Back to Journey
        </button>
      </div>
    );
  }

  const startYear = new Date(journey.start_date).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  const endYear = isNaN(new Date(journey.end_date).getTime())
    ? "Present"
    : new Date(journey.end_date).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });

  let contents = [];
  if (journey.contents && Array.isArray(journey.contents)) {
    contents = journey.contents;
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 max-w-4xl mx-auto">
      <motion.div variants={textVariant()}>
        <button
          onClick={() => navigate("/journey")}
          className="text-sky-500 hover:text-sky-700 font-medium text-sm mb-4 inline-block"
        >
          &larr; Back to Journey
        </button>
        <p className={styles.sectionSubText}>Work Experience</p>
        <h2 className={styles.sectionHeadText}>{journey.title}</h2>
      </motion.div>

      <motion.div
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-6 bg-white rounded-2xl shadow-md p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          {journey.icons && journey.icons.length > 0 && (
            <img
              src={typeof journey.icons[0] === "string" ? journey.icons[0] : journey.icons[0]?.icon_url || ""}
              alt={journey.office_name}
              className="w-16 h-16 rounded-full object-contain border-2 border-sky-500"
            />
          )}
          <div>
            <p className="text-sky-700 font-semibold text-base">
              {journey.office_name}
            </p>
            <p className="text-gray-500 text-sm">
              {journey.designation} &middot; {startYear} - {endYear}
            </p>
          </div>
        </div>

        {journey.description && (
          <div
            className="text-gray-700 text-sm leading-relaxed mb-4"
            dangerouslySetInnerHTML={{ __html: journey.description }}
          />
        )}

        {journey.url_of_company && (
          <a
            href={journey.url_of_company}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 hover:text-sky-700 text-sm font-medium underline"
          >
            Visit Company Website &rarr;
          </a>
        )}
      </motion.div>

      {contents.length > 0 && (
        <div className="mt-10">
          <motion.div variants={textVariant()}>
            <p className="text-secondary text-[14px] uppercase tracking-wider">
              Content
            </p>
            <h3 className="text-black font-bold md:text-[40px] sm:text-[30px] text-[25px]">
              Details
            </h3>
          </motion.div>

          <div className="mt-6">
            {contents.map((section, index) => (
              <ContentSection key={section.id || index} section={section} index={index} />
            ))}
          </div>
        </div>
      )}

      <hr className="border-gray-200 my-8" />
    </div>
  );
};

export default JourneyDetails;
