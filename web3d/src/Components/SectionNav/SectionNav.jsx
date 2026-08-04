/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

const SectionNav = ({ sections }) => {
  const [active, setActive] = useState(sections[0]?.id || "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-5 items-end">
      {sections.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            aria-label={label}
            aria-current={isActive ? "true" : undefined}
            className="group flex items-center gap-2.5 cursor-pointer"
          >
            <span
              className={`text-xs font-medium tracking-wide transition-all duration-300 ${
                isActive
                  ? "text-[#915EFF] opacity-100"
                  : "text-white/70 opacity-0 group-hover:opacity-100"
              }`}
            >
              {label}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                isActive
                  ? "w-3 h-3 bg-[#915EFF] shadow-[0_0_12px_rgba(145,94,255,0.9)]"
                  : "w-2.5 h-2.5 bg-white/50 border border-white/40 group-hover:bg-[#915EFF]/70"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
};

export default SectionNav;
