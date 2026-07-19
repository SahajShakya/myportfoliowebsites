import React, { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const ScrollReveal = ({ children, index = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (isInView) setAnimKey((k) => k + 1);
  }, [isInView]);

  const isVertical = index % 2 === 0;

  const duration = () => randomBetween(0.7, 1.1);
  const delay = (i) => randomBetween(0.05 * i, 0.15 * i + 0.2);

  const panels = isVertical
    ? [
        { bg: "bg-[#915EFF]", x: 0, y: `${randomBetween(-120, -60)}%` },
        { bg: "bg-[#6c3ce0]", x: 0, y: `${randomBetween(60, 120)}%` },
        { bg: "bg-[#4a1db5]", x: 0, y: `${randomBetween(-120, -60)}%` },
      ]
    : [
        { bg: "bg-[#915EFF]", x: `${randomBetween(-120, -60)}%`, y: 0 },
        { bg: "bg-[#6c3ce0]", x: 0, y: `${randomBetween(0, 1) > 0.5 ? randomBetween(-120, -60) : randomBetween(60, 120)}%` },
        { bg: "bg-[#4a1db5]", x: `${randomBetween(60, 120)}%`, y: 0 },
      ];

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {children}

      {isInView && (
        <div className="absolute inset-0 flex pointer-events-none z-20">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`${animKey}-${i}`}
              className={`flex-1 ${panels[i].bg}`}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: panels[i].x, y: panels[i].y, opacity: 0 }}
              transition={{
                duration: duration(),
                delay: delay(i),
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ScrollReveal;
