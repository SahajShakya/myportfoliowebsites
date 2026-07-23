/* eslint-disable react/no-unknown-property */
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useSnackbar } from "notistack";
import InputField from "../../../Components/Input/InputField";
import { motion, AnimatePresence } from "framer-motion";
import { Me } from "../../../Components/Model/Me";
import { useContactData } from "../../../Hooks/data/useContactData";
import { useSectionBgQuery } from "../../../Hooks/options/useSectionBgQuery";
import { styles } from "../../../styles";
import {
  FaLaptopCode,
  FaRobot,
  FaDraftingCompass,
  FaChalkboardTeacher,
  FaArrowLeft,
  FaPaperPlane,
} from "react-icons/fa";

const categories = [
  { id: "fullstack", label: "Full Stack", sub: "Web Dev", icon: FaLaptopCode },
  { id: "ml", label: "ML Project", sub: "Machine Learning", icon: FaRobot },
  { id: "cad", label: "CAD Design", sub: "Low Voltage MEP", icon: FaDraftingCompass },
  { id: "lecturing", label: "Lecturing", sub: "Teaching", icon: FaChalkboardTeacher },
];

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string(),
  address: Yup.string(),
  title: Yup.string().required("Reason is required"),
  message: Yup.string().required("Message is required"),
});

const Contact = () => {
  const { sendMessage } = useContactData();
  const { enqueueSnackbar } = useSnackbar();
  const { data: bgImage } = useSectionBgQuery("contact_bg_image");
  const [isRotating, setIsRotating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [focusedField, setFocusedField] = useState("");

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      title: "",
      message: "",
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const payload = { ...values, category: selectedCategory };

      try {
        await sendMessage(payload);
        enqueueSnackbar("Message sent!", { variant: "success" });
        resetForm();
        setSelectedCategory(null);
        setFocusedField("");
      } catch (err) {
        console.error("Failed to send message:", err);
        enqueueSnackbar("Failed to send. Try again.", { variant: "error" });
      }
    },
  });

  return (
    <section
      className="relative w-full min-h-screen"
      style={{
        background: bgImage
          ? `url(${bgImage}) center/cover no-repeat fixed`
          : "#0a0a1a",
      }}
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className={styles.sectionSubText}>Get in Touch</p>
          <h2 className={styles.sectionHeadText}>Hire Me.</h2>
        </motion.div>

        <div className="flex flex-col gap-10 mt-10 lg:flex-row">
          {/* Left: Form */}
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {!selectedCategory ? (
                <motion.div
                  key="pick"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-secondary text-[15px] mb-6">
                    What can I help you with?
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <motion.button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className="flex items-center gap-3 p-4 text-left transition-shadow bg-white border-2 border-black rounded-xl hover:shadow-neo-brutalism"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <div className="flex items-center justify-center w-10 h-10 text-white rounded-lg bg-neo-blue shrink-0">
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight text-black">{cat.label}</p>
                            <p className="text-xs text-secondary">{cat.sub}</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-1.5 text-secondary text-sm mb-4 hover:text-black transition-colors"
                  >
                    <FaArrowLeft size={11} />
                    Back
                  </button>

                  {(() => {
                    const cat = categories.find((c) => c.id === selectedCategory);
                    if (!cat) return null;
                    const Icon = cat.icon;
                    return (
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center text-white rounded-lg w-9 h-9 bg-neo-blue">
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-base font-bold text-black">{cat.label}</p>
                          <p className="text-xs text-secondary">{cat.sub}</p>
                        </div>
                      </div>
                    );
                  })()}

                  <form onSubmit={formik.handleSubmit} className="space-y-1">
                    <InputField
                      name="title"
                      type="text"
                      label="Reason to contact / hire me"
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.errors.title}
                      touched={formik.touched.title}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                    />

                    <div className="mb-6">
                      <label className="text-[10px] text-secondary uppercase tracking-wide block mb-1">
                        Detailed Description
                      </label>
                      <textarea
                        name="message"
                        rows="4"
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neo-blue transition-all duration-300 resize-none ${
                          formik.touched.message && formik.errors.message
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        value={formik.values.message}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Describe your project or requirements..."
                      />
                      {formik.touched.message && formik.errors.message && (
                        <p className="mt-1 text-xs text-red-500">{formik.errors.message}</p>
                      )}
                    </div>

                    <p className="text-[10px] text-secondary uppercase tracking-wide mb-2">
                      Your Contact Details
                    </p>

                    <InputField
                      name="name"
                      type="text"
                      label="Full Name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.errors.name}
                      touched={formik.touched.name}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                    />

                    <InputField
                      name="email"
                      type="email"
                      label="Email Address"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.errors.email}
                      touched={formik.touched.email}
                      focusedField={focusedField}
                      setFocusedField={setFocusedField}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                      <InputField
                        name="phone"
                        type="tel"
                        label="Phone (optional)"
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        focusedField={focusedField}
                        setFocusedField={setFocusedField}
                      />
                      <InputField
                        name="address"
                        type="text"
                        label="Address (optional)"
                        value={formik.values.address}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        focusedField={focusedField}
                        setFocusedField={setFocusedField}
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={formik.isSubmitting || !formik.isValid}
                      className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                        formik.isSubmitting || !formik.isValid
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-neo-blue hover:bg-blue-600 shadow-neo-brutalism"
                      }`}
                      whileHover={{ scale: formik.isValid ? 1.02 : 1 }}
                      whileTap={{ scale: formik.isValid ? 0.97 : 1 }}
                    >
                      {formik.isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <FaPaperPlane size={14} />
                          Send Message
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: 3D Model */}
          <motion.div
            className="w-full lg:w-1/2 h-[400px] sm:h-[500px] lg:h-[600px]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Canvas
              className={`w-full h-full bg-transparent ${
                isRotating ? "cursor-grabbing" : "cursor-grab"
              }`}
              camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 1000 }}
            >
              <directionalLight position={[0, 0, 1]} intensity={2.5} />
              <ambientLight intensity={1} />
              <pointLight position={[5, 10, 0]} intensity={2} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
              <Suspense fallback={null}>
                <Me
                  isRotating={isRotating}
                  setIsRotating={setIsRotating}
                  position={[0.5, 0.35, 0]}
                  rotation={[12.629, -0.6, 0]}
                  scale={[4.5, 4.5, 4.5]}
                />
              </Suspense>
            </Canvas>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;