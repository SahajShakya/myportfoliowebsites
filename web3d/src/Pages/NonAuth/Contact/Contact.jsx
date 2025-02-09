import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import emailjs from "@emailjs/browser";
import { useSnackbar } from "notistack";
import InputField from "../../../Components/Input/InputField"; // Your custom input field component
import LoadingScreen from "../../../Components/UI/Loading/LoadingScreen";
import { motion } from "framer-motion";
import WebContact from "../../../Components/Model/WebContact";

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  console.log(import.meta.env.VITE_APP_EMAILJS_SERVICE_ID);
  console.log(import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID);
  console.log(import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY);

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
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <motion.div
        className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-lg flex flex-col justify-center items-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-bold mb-4 text-center cursor-pointer">
          Get in Touch
        </h2>

        <form onSubmit={formik.handleSubmit} className="w-full">
          {/* Name input */}
          <InputField
            name="name"
            type="text"
            label="Name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.name}
            touched={formik.touched.name ?? false}
            focusedField={formik.focusedField}
            setFocusedField={formik.setFieldTouched}
          />

          {/* Email input */}
          <InputField
            name="email"
            type="email"
            label="Email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.email}
            touched={formik.touched.email ?? false}
            focusedField={formik.focusedField}
            setFocusedField={formik.setFieldTouched}
          />

          {/* Message input */}
          <div className="relative mb-6">
            <motion.textarea
              name="message"
              rows="4"
              className={`w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                formik.touched.message && formik.errors.message
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              value={formik.values.message}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              required
            />
            <motion.label
              htmlFor="message"
              className={`absolute left-3 transition-all duration-300 ${
                formik.values.message
                  ? "top-0 text-sm text-blue-500"
                  : "top-1/4 transform -translate-y-1/4 text-gray-500"
              }`}
            >
              Your Message
            </motion.label>
            {formik.touched.message && formik.errors.message && (
              <p className="text-red-500 text-xs mt-2">
                {formik.errors.message}
              </p>
            )}
          </div>

          {/* Submit button */}
          <motion.button
            className={`w-full text-white p-3 rounded-lg transition-all duration-300 ${
              formik.isSubmitting || !formik.isValid
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid}
            whileHover={{ scale: 1.05 }}
          >
            {loading ? "Sending..." : "Submit"}
          </motion.button>
        </form>
      </motion.div>

      <div className="lg:w-1/3 w-full lg:h-auto md:h-[450px] h-[300px]">
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
            <WebContact />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default Contact;
