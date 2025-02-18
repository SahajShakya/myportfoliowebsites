import React from "react";
import { Tilt } from "react-tilt";
import { motion } from "framer-motion";

import { styles } from "../../../styles";
import github from "./github.png";
import tiktak from "./tiktak.jpg";
import jobit from "./jobit.png";
import pcb from "./pcb.jpg";
import bio from "./bio.jpg";
import kecconf1 from "./kecconf1.jpg";
import youtube from "./youtube.png";
import { SectionWrapper } from "../../../hoc";

import { fadeIn, textVariant } from "../../../utils/motion";

const aprojects = [
  {
    name: "TikTak Project Using C",
    description:
      "My 1st semester project (Tiktactoe) C language, a simple application has been prepared. The Tic-tac-toe is a pencil game for two players, X and O, who takes turns marking the spaces in a 3X3 grid player. ",
    tags: [
      {
        name: "C",
        color: "blue-text-gradient",
      },
      {
        name: "Array",
        color: "green-text-gradient",
      },
    ],
    image: tiktak,
    source_code_link: "https://github.com/SahajShakya/Tiktaktoe_cProject",
  },
  {
    name: "Bank Management Using C++",
    description:
      "The topic for our project is 'Bank Management System'. File handling has been effectively used for each feature of this project. Our Bank Management System can add records, search, modify & delete records. General concepts of if while loops, functions, classes and file has been used to create this program.",
    tags: [
      {
        name: "C++",
        color: "blue-text-gradient",
      },
      {
        name: "OPP",
        color: "green-text-gradient",
      },
    ],
    image: jobit,
    source_code_link: "https://github.com/SahajShakya/BankManagemet-C-Project-",
  },
  {
    name: "Density Based Traffic Light",
    description:
      "Density Based Automatic Traffic Light Controlled System that helps to control traffics and reduces accidents.",
    tags: [
      {
        name: "Arduino",
        color: "blue-text-gradient",
      },
      {
        name: "AVR",
        color: "green-text-gradient",
      },
      {
        name: "Python",
        color: "pink-text-gradient",
      },
      {
        name: "CNN",
        color: "pink-text-gradient",
      },
    ],
    image: pcb,
    source_code_link:
      "https://github.com/SahajShakya/Desnsity-based-Traffic-Control-System-AVR-",
  },
  {
    name: "Bio Robotic Arm",
    description:
      "“Bio-Robotic arm” is project based on a biofeedback mechanical arm that uses a low dimensional input derived from EMG (electromyography) data. ",
    tags: [
      {
        name: "arduino",
        color: "blue-text-gradient",
      },
      {
        name: "raspberry pi",
        color: "green-text-gradient",
      },
      {
        name: "EMG< EEG",
        color: "pink-text-gradient",
      },
      {
        name: "python",
        color: "blue-text-gradient",
      },
      {
        name: "ANN",
        color: "green-text-gradient",
      },
    ],
    image: bio,
    source_code_link: "https://github.com/SahajShakya/Bio-Robotic-Arm",
    link: true,
    icon: youtube,
  },

  {
    name: "Thesis: SDN-Loadbalancing-and-DDOS-Detections",
    description:
      "This prject reduces the overhead in traffic, classify between traffic and DDoS Attack using SVM, find optimal path using DFS",
    tags: [
      {
        name: "python",
        color: "blue-text-gradient",
      },
      {
        name: "SVM",
        color: "green-text-gradient",
      },
      {
        name: "DFS",
        color: "pink-text-gradient",
      },
      {
        name: "GeneticAlgorithm",
        color: "blue-text-gradient",
      },
      {
        name: "SDN",
        color: "green-text-gradient",
      },
    ],
    image: kecconf1,
    source_code_link:
      "https://github.com/SahajShakya/SDN-Loadbalancing-and-DDOS-Detections",
  },
];

const ProjectCard = ({
  index,
  name,
  description,
  tags,
  image,
  source_code_link,
}) => {
  return (
    <motion.div variants={fadeIn("up", "spring", index * 0.5, 0.75)}>
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full"
      >
        <div className="relative w-full h-[230px]">
          <img
            src={image}
            alt="project_image"
            className="w-full h-full object-cover rounded-2xl"
          />

          <div className="absolute inset-0 flex justify-end m-3 card-img_hover">
            <div
              onClick={() => window.open(source_code_link, "_blank")}
              className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
            >
              <img
                src={github}
                alt="source code"
                className="w-1/2 h-1/2 object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-white font-bold text-[24px]">{name}</h3>
          <p className="mt-2 text-secondary text-[14px]">{description}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <p
              key={`${name}-${tag.name}`}
              className={`text-[14px] ${tag.color}`}
            >
              #{tag.name}
            </p>
          ))}
        </div>
      </Tilt>
    </motion.div>
  );
};

const AcademicWorks = () => {
  return (
    <>
      <motion.div variants={textVariant()}>
        <p className={`${styles.sectionSubText} `}>My work</p>
        <h2 className={`${styles.sectionHeadText}`}>Academic Works.</h2>
      </motion.div>

      <div className="w-full flex">
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
        >
          Following projects showcases my research and academic works
        </motion.p>
      </div>

      <div className="mt-20 flex flex-wrap gap-7">
        {aprojects.map((project, index) => (
          <ProjectCard key={`project-${index}`} index={index} {...project} />
        ))}
      </div>
    </>
  );
};

export default SectionWrapper(AcademicWorks, "academicworks");
