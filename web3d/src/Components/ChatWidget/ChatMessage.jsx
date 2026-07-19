import { motion } from "framer-motion";
import { FaRobot, FaUser, FaBan } from "react-icons/fa";

const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";
  const isOffTopic = message.relevance === "off_topic";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-2 mb-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isOffTopic ? "bg-gray-400" : "bg-blue-500"
        }`}>
          {isOffTopic ? (
            <FaBan className="text-white text-sm" />
          ) : (
            <FaRobot className="text-white text-sm" />
          )}
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-500 text-white rounded-br-md"
            : message.error
            ? "bg-red-100 text-red-700 border border-red-200 rounded-bl-md"
            : isOffTopic
            ? "bg-gray-50 text-gray-500 border border-gray-200 rounded-bl-md italic"
            : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200/50 text-xs text-gray-500">
            Sources:{" "}
            {message.sources.map((s, i) => (
              <span key={i} className="inline-block bg-gray-200/50 rounded px-1.5 py-0.5 mr-1 mb-1">
                {s.title || s.type}
              </span>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <FaUser className="text-gray-600 text-sm" />
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
