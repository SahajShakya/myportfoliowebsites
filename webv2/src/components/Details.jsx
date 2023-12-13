import React, { useEffect } from 'react';
import Tilt from "react-tilt";
import { motion } from "framer-motion";

import { styles } from "../styles";
import { github } from "../assets";
import { SectionWrapper } from "../hoc";
import { projects } from "../constants";
import { photoes } from "../constants";
import { fadeIn, textVariant } from "../utils/motion";
import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom';


const ProjectCard = ({
  index,
  image,
  des,
}) => {
  return (
    <motion.div variants={fadeIn("up", "spring", index * 0.5, 0.75)}>
      <Tilt
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className='bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full'
      >
        <div className='relative w-full h-[230px]'>
        <img
            src={image}
            alt='project_image'
            className='w-full h-full object-cover rounded-2xl'
          />

        </div>

        <div className='mt-5'>
          {/* <h3 className='text-white font-bold text-[24px]'>{}</h3> */}
          <p className='mt-2 text-secondary text-[14px]'>{des}</p>
        </div>


      </Tilt>
    </motion.div>
  );
};

const Details = () => {
  const { id } = useParams();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  const filteredItem = photoes.find(item => item.id == id);
  return (
    <>
      {
        filteredItem ?
        <div>
        <motion.div variants={textVariant()}>
          <h2 className={`${styles.sectionHeadText}`}>{filteredItem.title}</h2>
        <p className={`${styles.sectionSubText}`}>{filteredItem.description}</p>
        <p className={`${styles.sectionSubText}`} style={{ marginTop:'10px' }}>Detail Photoes</p>
      </motion.div>

      <div className='w-full flex'>
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className='mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]'
        >
          Photoes that tells the stories of the Awards
        </motion.p>
      </div>

      <div className='mt-20 flex flex-wrap gap-7'>
        {filteredItem?.images?.map((award, index) => (
          <ProjectCard key={`project-${index}`} index={id} {...award} />
        ))}
      </div>

      <div className='w-full flex'>
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className='mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]'
        >
          <Link to="/#awards">Go Back</Link>
        </motion.p>
      </div>
        </div>
        :
        <div className='w-full flex'>
        <motion.p
          variants={fadeIn("", "", 0.1, 1)}
          className='mt-3 text-secondary text-[17px] max-w-3xl leading-[30px] gap-6'
        >
          Photoes will be added soon
          <br />
          <Link to="/#awards" className='gap-4'>Go Back</Link>
        </motion.p>
      </div>
      }

    </>
  );
};

export default SectionWrapper(Details, "");
