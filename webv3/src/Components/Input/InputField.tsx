import React from "react";
import { motion } from "framer-motion";

interface InputFieldProps {
  name: string;
  type: string;
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  error: string | undefined;
  touched: boolean;
  focusedField: string | null;
  setFocusedField: React.Dispatch<React.SetStateAction<string | null>>;
}

const InputField: React.FC<InputFieldProps> = ({
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
}) => {
  const isFocused = focusedField === name || value !== ""; // Check if the input is focused or has value

  return (
    <div className="relative mb-6">
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
        required
      />
      <motion.label
        htmlFor={name}
        className={`absolute left-3 transition-all duration-300 ${
          isFocused
            ? "top-0 text-sm text-blue-500" // When focused or has value, move the label above
            : "top-1/4 transform -translate-y-1/4 text-gray-500" // Default when not focused
        }`}
      >
        {label}
      </motion.label>
      {touched && error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default InputField;
