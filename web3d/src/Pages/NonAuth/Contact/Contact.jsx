import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import emailjs from "@emailjs/browser";
import { useSnackbar } from "notistack";
import InputField from "../../../Components/Input/InputField"; // Your custom input field component
import LoadingScreen from "../../../Components/UI/Loading/LoadingScreen";
import { motion } from "framer-motion";
import { Fox } from "../../../Components/Model/Fox"; // Your custom 3D model component

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [currentAnimation, setCurrentAnimation] = useState("idle");

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      message: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string()
        .email("Invalid email address")
        .required("Email is required"),
      message: Yup.string().required("Message is required"),
    }),
    onSubmit: (values, { resetForm }) => {
      setLoading(true);

      emailjs
        .send(
          import.meta.env.VITE_APP_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID,
          {
            from_name: values.name,
            to_name: "Sahaj Shakya",
            from_email: values.email,
            to_email: "saz.shakya@gmail.com",
            message: values.message,
          },
          import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY
        )
        .then(
          () => {
            setLoading(false);
            enqueueSnackbar("Thank you for your message 😃", {
              variant: "success",
            });
            resetForm();
          },
          (error) => {
            setLoading(false);
            console.error(error);
            enqueueSnackbar("I didn't receive your message 😢", {
              variant: "error",
            });
          }
        );
    },
  });

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-gray-100 to-gray-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center gap-8 lg:flex-row">
          {/* Contact Form */}
          <motion.div
            className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg sm:p-8 lg:max-w-lg"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-2 text-2xl font-bold text-center text-gray-800 sm:text-3xl">
              Get in Touch
            </h2>
            <p className="mb-6 text-sm text-center text-gray-600 sm:text-base">
              Have a question or want to work together?
            </p>

            <form onSubmit={formik.handleSubmit} className="w-full space-y-4">
              {/* Name input */}
              <InputField
                name="name"
                type="text"
                label="Your Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.name}
                touched={formik.touched.name ?? false}
              />

              {/* Email input */}
              <InputField
                name="email"
                type="email"
                label="Your Email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.email}
                touched={formik.touched.email ?? false}
              />

              {/* Message input */}
              <div className="relative">
                <motion.textarea
                  name="message"
                  rows="5"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 resize-none ${
                    formik.touched.message && formik.errors.message
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  value={formik.values.message}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Your Message"
                  required
                />
                {formik.touched.message && formik.errors.message && (
                  <p className="mt-2 text-xs text-red-500">
                    {formik.errors.message}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <motion.button
                className={`w-full text-white p-3 sm:p-4 rounded-lg transition-all duration-300 font-semibold text-base sm:text-lg ${
                  formik.isSubmitting || !formik.isValid
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg"
                }`}
                type="submit"
                disabled={formik.isSubmitting || !formik.isValid}
                whileHover={{ scale: formik.isValid ? 1.02 : 1 }}
                whileTap={{ scale: formik.isValid ? 0.98 : 1 }}
              >
                {loading ? "Sending..." : "Send Message"}
              </motion.button>
            </form>
          </motion.div>

          {/* 3D Model Canvas */}
          <motion.div 
            className="w-full lg:w-1/2 h-[300px] sm:h-[400px] lg:h-[500px] max-w-md lg:max-w-none"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Canvas
              camera={{
                position: [0, 0, 5],
                fov: 75,
                near: 0.1,
                far: 1000,
              }}
            >
              <directionalLight position={[0, 0, 1]} intensity={2.5} />
              <ambientLight intensity={1} />
              <pointLight position={[5, 10, 0]} intensity={2} />
              <spotLight
                position={[10, 10, 10]}
                angle={0.15}
                penumbra={1}
                intensity={2}
              />

              <Suspense fallback={<LoadingScreen />}>
                <Fox
                  currentAnimation={currentAnimation}
                  position={[0.5, 0.35, 0]}
                  rotation={[12.629, -0.6, 0]}
                  scale={[0.5, 0.5, 0.5]}
                />
              </Suspense>
            </Canvas>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
