/* eslint-disable react/no-unescaped-entities */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaComments, FaTimes, FaTrash } from "react-icons/fa";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { useChat } from "../../hooks/useChat";

const ChatWidget = () => {
  const { messages, loading, isOpen, toggleChat, sendMessage, clearChat } = useChat();
  const messagesEndRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Show tooltip after 3s if user hasn't opened chat
  useEffect(() => {
    if (hasInteracted || isOpen) return;
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    const hideTimer = setTimeout(() => setShowTooltip(false), 8000);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [hasInteracted, isOpen]);

  const handleToggle = () => {
    setHasInteracted(true);
    setShowTooltip(false);
    toggleChat();
  };

  return (
    <div className="fixed z-50 bottom-4 right-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                  <FaComments className="text-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Sahaj's Assistant</h3>
                  <p className="text-[10px] text-blue-100">Ask me about Sahaj's work</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    title="Clear chat"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                )}
                <button
                  onClick={toggleChat}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
              {messages.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center text-gray-400"
                >
                  <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-50">
                    <FaComments className="text-2xl text-blue-400" />
                  </div>
                  <p className="mb-1 text-sm font-medium text-gray-600">Welcome!</p>
                  <p className="text-xs text-gray-400 max-w-[250px]">
                    I can tell you about Sahaj's projects, skills, experience, and achievements. Ask me anything!
                  </p>
                  <div className="mt-4 space-y-2 w-full max-w-[280px]">
                    {[
                      "What projects has Sahaj worked on?",
                      "What are Sahaj's technical skills?",
                      "Tell me about Sahaj's work experience",
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="w-full px-3 py-2 text-xs text-left text-gray-600 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {loading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2"
                >
                  <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <ChatInput onSend={sendMessage} disabled={loading} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Pulsing rings */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
            <span className="absolute inset-0 bg-blue-400 rounded-full animate-pulse opacity-10" style={{ animationDuration: "2s" }} />
          </>
        )}

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute right-0 px-4 py-2 mb-3 text-sm font-medium text-gray-700 bg-white border border-gray-100 shadow-lg bottom-full whitespace-nowrap rounded-xl"
            >
              <span className="mr-1">HEY</span> Ask me about Sahaj!
              <div className="absolute w-3 h-3 -mt-1 transform rotate-45 bg-white border-b border-r border-gray-100 top-full right-5" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleToggle}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          animate={
            !isOpen && !hasInteracted
              ? {
                  y: [0, -6, 0, -3, 0],
                  rotate: [0, -5, 5, -3, 0],
                }
              : {}
          }
          transition={
            !isOpen && !hasInteracted
              ? {
                  y: { duration: 1.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" },
                  rotate: { duration: 1.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" },
                }
              : { duration: 0.2 }
          }
          className="relative flex items-center justify-center text-white transition-shadow rounded-full shadow-lg w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <FaTimes className="text-xl" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <FaComments className="text-xl" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};

export default ChatWidget;
