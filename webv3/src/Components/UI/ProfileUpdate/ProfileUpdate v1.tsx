import React, { useState, useEffect } from 'react';
import { getAuth, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import InputField from '../../Input/InputField'; // Your custom input component
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { enqueueSnackbar } from 'notistack';

const ProfileUpdate = ({ handleCloseModal }: { handleCloseModal: () => void }) => {
    const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
        },
        validationSchema: Yup.object({
            name: Yup.string().required('Name is required'),
            email: Yup.string().email('Invalid email').required('Email is required'),
        }),
        onSubmit: async (values) => {
            if (userId) {
                setLoading(true);

                try {
                    // Step 1: Re-authenticate the user
                    const user = auth.currentUser;
                    if (user) {
                        if (!user.email) {
                            throw new Error("User email is null");
                        }
                        const password = prompt("Please enter your password");
                        if (!password) {
                            throw new Error("Password is required");
                        }
                        const credentials = EmailAuthProvider.credential(user.email, password);
                        await reauthenticateWithCredential(user, credentials);

                        // Step 2: Update the email in Firebase Authentication
                        await updateEmail(user, values.email);

                        // Step 3: Update the email in Firestore
                        const userDocRef = doc(db, 'users', userId);
                        await updateDoc(userDocRef, { email: values.email });

                        // Update Firebase Auth displayName
                        await updateProfile(user, {
                            displayName: values.name,
                        });

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

    if (!userData) {
        return <div>Loading...</div>; // Show loading until userData is fetched
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
        </div>
    );
};

export default ProfileUpdate;
