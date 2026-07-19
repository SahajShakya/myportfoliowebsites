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
import AcademicWorks from "../AcademicWork/AcademicWorks";
import Feedbacks from "../Testinomial/Feedbacks";

const AboutMe = () => {
  const [loopNum, setLoopNum] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");
  const [delta, setDelta] = useState(100 - Math.random());
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
      <section
        id="intro"
        className="relative w-full h-screen mx-auto mb-0 bg-cover bg-center bg-no-repeat"
        style={bgData?.data?.value ? { backgroundImage: `url(${bgData.data.value})` } : {}}
      >
        {!bgData?.data?.value && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        <div
          className={`absolute inset-0 top-[120px] max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5 z-10`}
        >
          <div className="flex flex-col justify-center items-center mt-5">
            <div className="w-5 h-5 rounded-full bg-[#915EFF]" />
            <div className="w-1 sm:h-80 h-40 violet-gradient" />
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
                      className="txt-rotate text-white"
                    >
                      <span className="wrap">{text}</span>
                    </span>
                  </h1>
                </div>
              )}
            </TrackVisibility>
            <p className={`${styles.heroSubBlackText} mt-2 text-black bg-white/80 inline-block px-4 py-2 rounded-lg`}>
              Bachelors in Electronics and Communication Engineering{" "}
              <br className="sm:block hidden" />
              Masters in Computer Engineering
            </p>
          </div>
        </div>
      </section>
      <ScrollReveal index={0}>
        <section id="academics">
          <Academics id="academics" />
        </section>
      </ScrollReveal>

      <ScrollReveal index={1}>
        <AcademicWorks id="academic-works" />
      </ScrollReveal>

      <ScrollReveal index={2}>
        <Achievements id="achievements" />
      </ScrollReveal>

      <ScrollReveal index={3}>
        <Journey id="journey" />
      </ScrollReveal>

      <ScrollReveal index={4}>
        <Projects id="projects" />
      </ScrollReveal>

      <ScrollReveal index={5}>
        <Feedbacks id="feedbacks" />
      </ScrollReveal>

      <ScrollReveal index={6}>
        <Contact id="contact" />
      </ScrollReveal>
    </div>
  );
};

export default AboutMe;
