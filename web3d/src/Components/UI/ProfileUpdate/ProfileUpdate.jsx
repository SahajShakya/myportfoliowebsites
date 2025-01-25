import React, { useState, useEffect } from "react";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import InputField from "../../Input/InputField"; // Your custom InputField
import { useFormik } from "formik";
import * as Yup from "yup";
import { enqueueSnackbar } from "notistack";
import Modal from "../Modal/Modal"; // Import the Modal component

const ProfileUpdate = ({
  handleCloseModal,
  isCounting,
  setIsCounting,
}) => {
  const [userData, setUserData] = useState<{
    name,
    email
  } | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEmailChanged, setIsEmailChanged] = useState(false);

  const [countdown, setCountdown] = useState(60);
  // const [isCounting, setIsCounting] = useState(false); // Removed duplicate state declaration
  const [showCountdown, setShowCountdown] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

  // Fetch user data from Firestore
  useEffect(() => {
    if (userId) {
      const userDocRef = doc(db, "users", userId);
      getDoc(userDocRef)
        .then((docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserData(docSnapshot.data());
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
      updateDoc(userDocRef, {
        updatedAt: new Date(),
      });
    }
  }, [userId, db]);

  useEffect(() => {
    let interval
    if (isCounting && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1); // Decrease countdown by 1 every second
      }, 1000);
    } else if (countdown === 0) {
      clearInterval(interval); // Stop the countdown when it reaches 0
      handleCloseModal(); // Close the modal when countdown reaches 0
    }

    // Cleanup interval when the component is unmounted or countdown stops
    return () => clearInterval(interval);
  }, [isCounting, countdown, handleCloseModal]);

  // Function to handle button click to start countdown
  const handleStartCountdown = () => {
    // console.log("Starting countdown...");
    setIsCounting(true); // Start the countdown
    setShowCountdown(true); // Show the countdown
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: userData?.name || "",
      email: userData?.email || "",
      password: "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
    }),
    onSubmit: async (values) => {
      if (userId) {
        setLoading(false);

        try {
          // Step 1: Check if email has changed
          if (values.email !== userData?.email) {
            setIsEmailChanged(true); // Set flag for email change
            setShowPasswordModal(true); // Show password modal
          } else {
            // If email is not changed, directly update name and profile
            if (auth.currentUser) {
              await updateProfile(auth.currentUser, {
                displayName: values.name,
              });
            }
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, { name: values.name });
            enqueueSnackbar("Profile updated successfully!", {
              variant: "success",
            });
            handleCloseModal();
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          //   console.error('Error updating profile:', error);
          enqueueSnackbar("Update failed. Please try again.", {
            variant: "error",
          });
        } finally {
          setLoading(false);
        }
      }
    },
  });

  const reauthenticateUser = async (password) => {
    const user = getAuth().currentUser;
    if (user) {
      const credential = EmailAuthProvider.credential(user.email, password);
      try {
        await reauthenticateWithCredential(user, credential);

        // console.log("User reauthenticated successfully.");
        enqueueSnackbar("User reauthenticated successfully!", {
          variant: "success",
        });
        return true;
      } catch (error) {
        // console.error("Reauthentication failed", error);
        enqueueSnackbar(String(error), { variant: "success" });
        return false;
      }
    }
    return false;
  };

  const updateEmailAndSendVerification = async (
    newEmail,
    password
  ) => {
    const user = getAuth().currentUser;
    if (user && (await reauthenticateUser(password))) {
      try {
        // Step 1: Update the email in Firebase Authentication
        await updateEmail(user, newEmail);

        // Step 2: Send verification email to the new email
        await sendEmailVerification(user);
        // console.log("Email updated. A verification email has been sent to:", newEmail);

        // Inform user to verify the email
        enqueueSnackbar(
          "Email updated. Please verify your new email address.",
          { variant: "success" }
        );
        handleStartCountdown(); // Start the countdown

        // Wait for email verification to be completed before proceeding
        const checkEmailVerifiedInterval = setInterval(async () => {
          await user.reload();
          if (user.emailVerified) {
            clearInterval(checkEmailVerifiedInterval); // Stop checking once verified
            enqueueSnackbar("Email verified successfully!", {
              variant: "success",
            });

            //   console.log("Email verified successfully.");
            // Step 3: Now update the email in Firestore as well
            if (userId) {
              const userDocRef = doc(db, "users", userId);
              await updateDoc(userDocRef, { email: newEmail });
            } else {
              throw new Error("User ID is undefined");
            }
            enqueueSnackbar("Email updated successfully in Firestore.", {
              variant: "success",
            });
            handleCloseModal();
            setIsCounting(false); // Stop the countdown
          }
        }, 3000);

        // Stop the process after 1 minute (60000 milliseconds)
        setTimeout(() => {
          clearInterval(checkEmailVerifiedInterval); // Stop checking after 1 minute
          // console.log("Email verification check stopped after 1 minute.");

          enqueueSnackbar("Email verification check stopped due to timeout.", {
            variant: "warning",
          });
          setLoading(true);
          setIsCounting(false); // Stop the countdown
        }, 60000);
      } catch (error) {
        // console.error("Error updating email:", error);
        enqueueSnackbar(String(error), {
          variant: "error",
        });
        setLoading(true);
      }
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      await updateEmailAndSendVerification(formik.values.email, password);

      setShowPasswordModal(false); // Close password modal after successful update
    } catch (error) {
      setPasswordError("Incorrect password. Please try again.");
      enqueueSnackbar(String(error), { variant: "error" });
      setPassword("");

      //   console.error('Error re-authenticating:', error);
    }
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <form onSubmit={formik.handleSubmit}>
        <InputField
          name="name"
          type="text"
          label="Name"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.name}
          touched={formik.touched.name || false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />
        <InputField
          name="email"
          type="email"
          label="Email"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.email}
          touched={formik.touched.email || false}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
        />
        {showCountdown && (
          <div className="flex items-center mt-2">
            <p className="text-sm text-gray-500">
              Email verification will expire in {countdown} seconds.
            </p>
          </div>
        )}
        <button
          type="submit"
          className="mt-4 p-2 bg-blue-500 text-white rounded-md"
          disabled={loading || isCounting}
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <Modal
          title="Please enter your password"
          onClose={() => !isCounting && setShowPasswordModal(false)} // Disable closing while countdown is active
        >
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 p-2 border border-gray-300 rounded-md w-full"
              placeholder="Enter your password"
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-2">{passwordError}</p>
            )}
          </div>
          <button
            onClick={handlePasswordSubmit}
            className="w-full bg-blue-500 text-white p-2 rounded-md"
          >
            Submit
          </button>
        </Modal>
      )}
    </div>
  );
};

export default ProfileUpdate;
