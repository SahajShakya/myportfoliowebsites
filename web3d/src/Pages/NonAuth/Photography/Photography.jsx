import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { styles } from "../../../styles";
import { SectionWrapper } from "../../../hoc";
import { fadeIn, textVariant } from "../../../utils/motion";
import { usePhotographyQuery } from "../../../Hooks/options/usePhotographyQuery";
import { FaTimes, FaChevronLeft, FaChevronRight, FaImage } from "react-icons/fa";

const PhotoLightbox = ({ post, onClose }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = post.photos || [];

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && photos.length > 1) nextPhoto();
      if (e.key === "ArrowLeft" && photos.length > 1) prevPhoto();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
      >
        <FaTimes size={24} />
      </button>

      <div
        className="flex flex-col items-center max-w-6xl w-full mx-4 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Post container - Instagram style */}
        <div className="bg-black rounded-xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] w-full">
          {/* Photo section */}
          <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center">
            {photos.length > 0 && (
              <>
                <img
                  src={photos[currentPhotoIndex].photo_url}
                  alt={photos[currentPhotoIndex].caption || post.title}
                  className="max-h-[80vh] max-w-full object-contain"
                />

                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
                    >
                      <FaChevronLeft size={14} />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
                    >
                      <FaChevronRight size={14} />
                    </button>

                    {/* Photo dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentPhotoIndex(idx)}
                          className={`w-2 h-2 rounded-full transition ${
                            idx === currentPhotoIndex ? "bg-white" : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Photo counter */}
                {photos.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info section */}
          <div className="w-full md:w-80 bg-black border-t md:border-t-0 md:border-l border-white/10 flex flex-col overflow-y-auto">
            {/* Title & description */}
            <div className="p-4 flex-1">
              <h3 className="text-white font-semibold text-lg mb-2">{post.title}</h3>
              {post.description && (
                <div
                  className="text-white/70 text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.description }}
                />
              )}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((t, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full"
                    >
                      #{t.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Caption of current photo */}
            {photos[currentPhotoIndex]?.caption && (
              <div className="px-4 pb-4">
                <p className="text-white/50 text-xs italic">
                  {photos[currentPhotoIndex].caption}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PhotoCard = ({ post, index, onClick }) => {
  const photos = post.photos || [];
  const coverPhoto = photos[0];

  return (
    <motion.div
      variants={fadeIn("up", "spring", index * 0.1, 0.75)}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
        {coverPhoto ? (
          <img
            src={coverPhoto.photo_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <FaImage size={48} />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-4 text-white">
            {photos.length > 1 && (
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <FaImage size={14} /> {photos.length}
              </span>
            )}
          </div>
        </div>

        {/* Multi-photo badge */}
        {photos.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <FaImage size={10} /> {photos.length}
          </div>
        )}
      </div>

      {/* Info below card */}
      <div className="mt-3 px-1">
        <h3 className="text-black font-semibold text-base truncate">{post.title}</h3>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {post.tags.slice(0, 3).map((t, i) => (
              <span key={i} className="text-xs text-secondary">
                #{t.tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Photography = () => {
  const { data: postsData, isLoading } = usePhotographyQuery();
  const posts = postsData || [];
  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Visual Stories</p>
        <h2 className={styles.sectionHeadText}>Photography.</h2>
      </motion.div>

      <div className="w-full flex">
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
        >
          A collection of moments captured through my lens.
        </motion.p>
      </div>

      {isLoading ? (
        <p className="mt-20 text-secondary text-[16px]">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="mt-20 text-secondary text-[16px]">No photography posts yet.</p>
      ) : (
        <motion.div
          variants={staggerContainer()}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {posts.map((post, index) => (
            <PhotoCard
              key={post.id}
              post={post}
              index={index}
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPost && (
          <PhotoLightbox
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const staggerContainer = (staggerChildren, delayChildren) => {
  return {
    hidden: {},
    show: {
      transition: {
        staggerChildren: staggerChildren,
        delayChildren: delayChildren || 0,
      },
    },
  };
};

export default SectionWrapper(Photography, "photography");