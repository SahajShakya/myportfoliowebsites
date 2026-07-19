import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPaperPlane, FaSpinner } from "react-icons/fa";

const ChatInput = ({ onSend, disabled }) => {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
      setValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-200 bg-white">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about Sahaj's work..."
        disabled={disabled}
        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
      />
      <motion.button
        type="submit"
        disabled={!value.trim() || disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          value.trim() && !disabled
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {disabled ? (
          <FaSpinner className="animate-spin text-sm" />
        ) : (
          <FaPaperPlane className="text-sm" />
        )}
      </motion.button>
    </form>
  );
};

export default ChatInput;
