/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useAboutBgQuery } from "../../../Hooks/options/useSettingsQuery";
import { motion } from "framer-motion";
import TrackVisibility from "react-on-screen";
import { styles } from "../../../styles";
import ScrollReveal from "../../../Components/ScrollReveal/ScrollReveal";
import api from "../../../api/client";
import Journey from "../Journey/Journey";
import Academics from "../Academics/Academics";
import Achievements from "../Acheivements/Acheivements";
import Projects from "../Projects/Projects";
import Contact from "../Contact/Contact";
import Feedbacks from "../Testinomial/Feedbacks";
import SectionNav from "../../../Components/SectionNav/SectionNav";

const SECTIONS = [
  { id: "intro", label: "Intro" },
  { id: "education", label: "Education" },
  { id: "Achievement", label: "Achievement" },
  { id: "journey", label: "Journey" },
  { id: "project", label: "Project" },
  { id: "testimonials", label: "Testimonial" },
  { id: "contact", label: "Contact" },
];

const AboutMe = () => {
  const [loopNum, setLoopNum] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");
  const [delta, setDelta] = useState(100 - Math.random());
  // eslint-disable-next-line no-unused-vars
  const [index, setIndex] = useState(1);
  const { data: bgData } = useAboutBgQuery();
  const toRotate = [
    "Electronics Engineer",
    "Computer Engineer",
    "Web Developer",
    "Teacher",
    "Researcher",
    "Photographer",
  ];
  const period = 1000;

  useEffect(() => {
    let ticker = setInterval(() => {
      tick();
    }, delta);

    return () => {
      clearInterval(ticker);
    };
  }, [text]);

  const tick = () => {
    let i = loopNum % toRotate.length;
    let fullText = toRotate[i];
    let updatedText = isDeleting
      ? fullText.substring(0, text.length - 1)
      : fullText.substring(0, text.length + 1);

    setText(updatedText);

    if (isDeleting) {
      setDelta((prevDelta) => prevDelta / 2);
    }

    if (!isDeleting && updatedText === fullText) {
      setIsDeleting(true);
      setIndex((prevIndex) => prevIndex - 1);
      setDelta(period);
    } else if (isDeleting && updatedText === "") {
      setIsDeleting(false);
      setLoopNum(loopNum + 1);
      setIndex(1);
      setDelta(20);
    } else {
      setIndex((prevIndex) => prevIndex + 1);
    }
  };

  // Scroll and update URL only for the "intro" section
  useEffect(() => {
    const handleScroll = () => {
      const introSection = document.getElementById("intro");

      if (introSection) {
        const rect = introSection.getBoundingClientRect();

        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          window.history.replaceState(null, "", "#intro");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="about-me">
      <SectionNav sections={SECTIONS} />
      <section
        id="intro"
        className="relative w-full h-screen mx-auto mb-0 overflow-hidden pt-[80px]"
      >
        <div
          className="absolute inset-0 -z-10"
          style={
            bgData?.value
              ? {
                  backgroundImage: `url(${bgData.value})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }
              : {
                  background: "linear-gradient(to bottom right, #f3f4f6, #e5e7eb)",
                }
          }
        />
        <div
          className={`absolute inset-0 top-[120px] max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5 z-10`}
        >
          <div className="flex flex-col items-center justify-center mt-5">
            <div className="w-5 h-5 rounded-full bg-[#915EFF]" />
            <div className="w-1 h-40 sm:h-80 violet-gradient" />
          </div>

          <div style={{ textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
            <h1 className={`${styles.heroHeadBlackText} text-white`}>
              Hi, I'm <span className="text-[#915EFF]">Sahaj Shakya</span>
            </h1>
            <TrackVisibility>
              {({ isVisible }) => (
                <div
                  className={
                    isVisible ? "animate__animated animate__fadeIn" : ""
                  }
                >
                  <h1 className="text-white">
                    {`I am a`}{" "}
                    <span
                      className="text-white txt-rotate"
                    >
                      <span className="wrap">{text}</span>
                    </span>
                  </h1>
                </div>
              )}
            </TrackVisibility>
            <p className={`${styles.heroSubBlackText} mt-2 text-white`}>
              Bachelors in Electronics and Communication Engineering{" "}
              <br className="hidden sm:block" />
              Masters in Computer Engineering
            </p>
          </div>
        </div>
      </section>
      <ScrollReveal index={0}>
        <section id="education" className="scroll-mt-20">
          <Academics />
        </section>
      </ScrollReveal>

      <ScrollReveal index={1}>
        <section id="Achievement" className="scroll-mt-20">
          <Achievements />
        </section>
      </ScrollReveal>

      <ScrollReveal index={2}>
        <section id="journey" className="scroll-mt-20">
          <Journey />
        </section>
      </ScrollReveal>

      <ScrollReveal index={3}>
        <section id="project" className="scroll-mt-20">
          <Projects />
        </section>
      </ScrollReveal>

      <ScrollReveal index={4}>
        <section id="testimonials" className="scroll-mt-20">
          <Feedbacks />
        </section>
      </ScrollReveal>

      <ScrollReveal index={5}>
        <section id="contact" className="scroll-mt-20">
          <Contact />
        </section>
      </ScrollReveal>
    </div>
  );
};

export default AboutMe;
