import React from "react";
import {
  motion,
  MotionValue,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Link } from "react-router-dom";


const mapRange = (
  inputLower,
  inputUpper,
  outputLower,
  outputUpper
) => {
  const INPUT_RANGE = inputUpper - inputLower;
  const OUTPUT_RANGE = outputUpper - outputLower;

  return (value) =>
    outputLower + (((value - inputLower) / INPUT_RANGE) * OUTPUT_RANGE || 0);
};

const setTransform = (
  item,
  event,
  x,
  y
) => {
  const bounds = item.getBoundingClientRect();
  const relativeX = event.clientX - bounds.left;
  const relativeY = event.clientY - bounds.top;
  const xRange = mapRange(0, bounds.width, -1, 1)(relativeX);
  const yRange = mapRange(0, bounds.height, -1, 1)(relativeY);
  x.set(xRange * 10);
  y.set(yRange * 10);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NavLink = ({ path, name, isActive, location, logo }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const textX = useTransform(x, (latest) => latest * 0.5);
  const textY = useTransform(y, (latest) => latest * 0.5);

  return (
    <motion.li
      onPointerMove={(event) => {
        const item = event.currentTarget;
        setTransform(item, event, x, y);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y }}
    >
      <motion.div
        className={`relative inline-block w-full max-w-5xl py-2 px-4 text-sm transition-all duration-500 ease-out ${
          isActive ? "bg-slate-300" : ""
        }`}
      >
        <a
          href={path} // Use href to ensure the link behaves as a regular anchor tag
          target="_blank" // Ensure it opens in a new tab
          className="text-2xl relative"
        >
          <motion.span style={{ x: textX, y: textY }} className="z-10 relative">
            {logo ? (
              <img src={logo} alt="Logo" className="h-6 w-6 object-contain" />
            ) : (
              <div className="py-2 px-4 text-xl pt-2 flex justify-around rounded-full border-2 border-black bg-white">
                {name}
              </div>
            )}
          </motion.span>
          {isActive && (
            <motion.div
              transition={{ type: "spring" }}
              layoutId="underline"
              className="absolute w-full h-full rounded-md left-0 bottom-0 bg-blue-300"
            />
          )}
        </a>
      </motion.div>
    </motion.li>
  );
};

export default NavLink;
