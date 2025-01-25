import React, { useState, useEffect } from 'react';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updateEmail, updateProfile, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import InputField from '../../Input/InputField'; // Your custom InputField
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { enqueueSnackbar } from 'notistack';
import Modal from '../Modal/Modal'; // Import the Modal component

const ProfileUpdate = ({ handleCloseModal }: { handleCloseModal: () => void }) => {
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailChanged, setIsEmailChanged] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const userId = auth.currentUser?.uid;

  // Fetch user data from Firestore
  useEffect(() => {
    if (userId) {
      const userDocRef = doc(db, 'users', userId);
      getDoc(userDocRef)
        .then((docSnapshot) => {
          if (docSnapshot.exists()) {
            setUserData(docSnapshot.data() as { name: string; email: string });
          }
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
        });
    }
  }, [userId, db]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: userData?.name || '',
      email: userData?.email || '',
      password: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email').required('Email is required'),
    }),
    onSubmit: async (values) => {
      if (userId) {
        setLoading(true);

        try {
          // Step 1: Check if email has changed
          if (values.email !== userData?.email) {
            setIsEmailChanged(true); // Set flag for email change
            setShowPasswordModal(true); // Show password modal
          } else {
            // If email is not changed, directly update name and profile
            await updateProfile(auth.currentUser!, { displayName: values.name });
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, { name: values.name });
            enqueueSnackbar("Profile updated successfully!", { variant: "success" });
            handleCloseModal();
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          enqueueSnackbar("Update failed. Please try again.", { variant: "error" });
        } finally {
          setLoading(false);
        }
      }
    },
  });

  const reauthenticateUser = async (password: string) => {
    const user = getAuth().currentUser;
    if (user) {
      const credential = EmailAuthProvider.credential(user.email!, password);
      try {
        await reauthenticateWithCredential(user, credential);
        console.log("User reauthenticated successfully.");
        return true;
      } catch (error) {
        console.error("Reauthentication failed", error);
        return false;
      }
    }
    return false;
  };

  const updateEmailAndSendVerification = async (newEmail: string, password: string) => {
    const user = getAuth().currentUser;
    if (user && await reauthenticateUser(password)) {
      try {
        // Step 1: Update the email in Firebase Authentication
        await updateEmail(user, newEmail);

        // Step 2: Send verification email to the new email
        await sendEmailVerification(user);
        console.log("Email updated. A verification email has been sent to:", newEmail);

        // Inform user to verify the email
        enqueueSnackbar("Email updated. Please verify your new email address.", { variant: "success" });

        // Wait for email verification to be completed before proceeding
        const checkEmailVerifiedInterval = setInterval(async () => {
          await user.reload();
          if (user.emailVerified) {
            clearInterval(checkEmailVerifiedInterval); // Stop checking once verified
            console.log("Email verified successfully.");
            // Step 3: Now update the email in Firestore as well
            if (userId) {
              const userDocRef = doc(db, 'users', userId);
              await updateDoc(userDocRef, { email: newEmail });
            } else {
              throw new Error("User ID is undefined");
            }
            enqueueSnackbar("Email updated successfully in Firestore.", { variant: "success" });
            handleCloseModal();
          }
        }, 3000); // Check every 3 seconds if email is verified

      } catch (error) {
        console.error("Error updating email:", error);
        enqueueSnackbar("Error updating email. Please try again.", { variant: "error" });
      }
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      await updateEmailAndSendVerification(formik.values.email, password);
      setShowPasswordModal(false); // Close password modal after successful update
    } catch (error) {
      setPasswordError('Incorrect password. Please try again.');
      enqueueSnackbar(String(error), { variant: "error" });
      console.error('Error re-authenticating:', error);
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
        <button type="submit" className="mt-4 p-2 bg-blue-500 text-white rounded-md" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <Modal title="Please enter your password" onClose={() => setShowPasswordModal(false)}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 p-2 border border-gray-300 rounded-md w-full"
              placeholder="Enter your password"
            />
            {passwordError && <p className="text-red-500 text-sm mt-2">{passwordError}</p>}
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