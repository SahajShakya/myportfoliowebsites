import React from "react";
import { motion } from "framer-motion";

const InputField = ({
  name,
  type,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  focusedField,
  setFocusedField,
  accept,
}) => {
  const isFocused = focusedField === name || value !== ""; // Check if the input is focused or has value

  return (
    <div className="relative mb-6">
      <motion.label
        htmlFor={name}
        className={`absolute left-3 transition-all duration-300 ${
          isFocused
            ? "top-0 text-sm text-blue-500"
            : "top-1/4 transform -translate-y-1/4 text-gray-500"
        }`}
      >
        {label}
      </motion.label>
      {type === "file" ? (
        <div className="relative">
          <motion.input
            type="file"
            id={name}
            name={name}
            className="absolute opacity-0 cursor-pointer w-full h-full z-10"
            onChange={onChange}
            onBlur={onBlur}
            accept={accept}
          />
          <div className="flex justify-between items-center bg-gray-100 border border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-200">
            <span className="text-gray-500">
              {value ? value.name : "Choose a file"}
            </span>
            <div className="text-blue-500">Browse</div>
          </div>
          {value && (
            <div className="flex items-center mt-2">
              <img
                src={URL.createObjectURL(value)}
                alt="preview"
                className="w-8 h-8 rounded-full mr-2"
              />
              <button
                type="button"
                onClick={() => onChange({ target: { name, value: null } })}
                className="text-red-500 text-xs"
              >
                X
              </button>
            </div>
          )}
        </div>
      ) : (
        <motion.input
          type={type}
          id={name}
          name={name}
          className={`w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
            touched && error ? "border-red-500" : "border-gray-300"
          }`}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={() => setFocusedField(name)}
        />
      )}
      {touched && error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default InputField;
