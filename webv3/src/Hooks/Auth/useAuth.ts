/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import {
  doc,
  setDoc,
  getDoc,
  Timestamp,
  collection,
  getDocs,
  QuerySnapshot,
  DocumentData,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// Function to get the user's role name from Firestore
export const getUserRoleFromFirestore = async (
  uid: string
): Promise<{ role: string | null; roleId: string | null }> => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();

      const roleId = userData?.role;
      if (!roleId) {
        return { role: null, roleId: null }; // If no roleId, return null for both
      }

      const roles = await fetchAllFromCollection("roles");
      const role = roles.find((role) => role.id === roleId);

      if (role) {
        return { role: role.name || null, roleId: roleId }; // Return both role name and roleId
      } else {
        return { role: null, roleId: null }; // Return null if role document doesn't exist
      }
    } else {
      return { role: null, roleId: null }; // Return null if user document doesn't exist
    }
  } catch (error) {
    console.error("Error fetching user role:", error);
    return { role: null, roleId: null }; // Return null in case of error
  }
};

export const ActiveUser = async (
  userId: string,
  name: string,
  email: string,
  role: string,
  token: string
): Promise<void> => {
  await setDoc(doc(db, "activeUsers", userId), {
    id: userId,
    name,
    email,
    role,
    token,
    ActiveTime: Timestamp.now(),
    isLoggedIn: true,
  });
};

// Type definition for the response data
interface DocumentItem {
  id: string;
  [key: string]: any; // This is to allow any fields that might be in the document data
}

// Function to fetch all documents from a Firestore collection
async function fetchAllFromCollection(
  collectionName: string
): Promise<DocumentItem[]> {
  try {
    // Get a reference to the collection
    const colRef = collection(db, collectionName);

    // Get all documents in the collection
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(colRef);

    // Array to hold the data from all documents
    const data: DocumentItem[] = [];

    // Iterate through each document and push data into the array
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    // Return the fetched data
    return data;
  } catch (error) {
    console.error("Error fetching documents: ", error);
    return [];
  }
}

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  // const [userRole, setUserRole] = useState<string | null>(null); // Track the user's role
  const [error, setError] = useState<string | null>(null);

  const register = async (
    email: string,
    password: string,
    name: string,
    role: string = "patient"
  ) => {
    try {
      // Create a new user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Now the user's profile includes the display name
      await userCredential.user;

      const userId = userCredential.user.uid;

      // Fetch the role ID dynamically from the roles collection based on the provided role
      const roleDocRef = doc(db, "roles", role); // Use the passed role (like "patient", "doctor", etc.)
      const roleDoc = await getDoc(roleDocRef);

      if (!roleDoc.exists()) {
        throw new Error(
          `Role '${role}' does not exist in the roles collection.`
        );
      }

      const roleData = roleDoc.data();
      const roleId = roleData?.id;

      // Create the new user document in Firestore with the fetched role ID
      await setDoc(doc(db, "users", userId), {
        id: userId,
        name,
        email,
        role: roleId, // Set the role ID (dynamic) instead of a string
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        isLoggedIn: false,
      });

      // Send email verification
      await sendEmailVerification(userCredential.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      const userId = userCredential.user.uid;
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          isLoggedIn: true,
        });
      }

      // Get custom claims (e.g., role or admin status)
      // const idTokenResult = await user.getIdTokenResult();
      // const isAdmin = idTokenResult.claims.admin || false;
      // const role = isAdmin
      //   ? "admin"
      //   : await getUserRoleFromFirestore(userCredential.user.uid);
      // // You can also store other user info if needed
      // localStorage.setItem(
      //   "user",
      //   JSON.stringify({
      //     uid: user.uid,
      //     email: user.email,
      //     role,
      //   })
      // );
      // setUserRole(role);
      return userCredential;
    } catch (err: any) {
      // console.error(err);
      setError(err.message);
      throw err;
    }
  };

  const getUserData = async (userId: string) => {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() : null;
  };

  async function logout(userId: string) {
    try {
      console.log("Logout called inside Custom Auth", userId);

      // 1. Set isActive field to false in the "users" collection
      const userDocRef = doc(db, "users", userId);
      const userDocSnapshot = await getDoc(userDocRef);

      if (userDocSnapshot.exists()) {
        await updateDoc(userDocRef, {
          isLoggedIn: false,
          lastLogin: Timestamp.now(),
        });
        console.log(`User ${userId} is now inactive.`);
      } else {
        console.log(`User with id ${userId} not found.`);
      }

      // 2. Deleting the field in "activeUsers" collection where uid matches userId
      const activeUsersDocRef = doc(db, "activeUsers", userId); // Assuming userId is the document ID
      const activeUsersDocSnapshot = await getDoc(activeUsersDocRef);

      if (activeUsersDocSnapshot.exists()) {
        const data = activeUsersDocSnapshot.data();
        // const userKeys = Object.keys(data); // Get all field keys

        try {
          if (data) {
            await deleteDoc(doc(db, "activeUsers", userId));
            console.log(
              `Field with userId ${userId} deleted from activeUsers.`
            );
          }
          await deleteDoc(doc(db, "activeUsers", userId));
          console.log(`Field with userId ${userId} deleted from activeUsers.`);
        } catch (error) {
          throw new Error("Error deleting field from activeUsers: " + error);
        }

        // // Check if the userId is a key in the activeUsers document
        // if (userKeys.includes(userId)) {
        //   // await updateDoc(activeUsersDocRef, {
        //   //   userId: deleteField(), // Use the deleteField() method to remove the field dynamically
        //   // });
        //   console.log(`Field with userId ${userId} deleted from activeUsers.`);
        // } else {
        //   console.log(`UserId ${userId} not found as a field in activeUsers.`);
        // }
      } else {
        console.log("No data found in activeUsers document.");
      }

      // Optional: Sign out the user after logout actions
      await auth.signOut();
      console.log(`User ${userId} logged out successfully.`);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }

  return {
    user, // Return the userRole so it can be accessed
    error,
    register,
    login,
    getUserData,
    ActiveUser,
    logout,
  };
};
