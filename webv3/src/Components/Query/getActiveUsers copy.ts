import { useQuery } from "react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase"; // Import your Firestore instance

// TypeScript interface for the User document data
interface User {
  uid: string;
  name: string;
  email: string;
  role: string;
  token: string;
  // Add other fields you expect in your user document
}
// Function to fetch user data from Firestore
const fetchUser = async (uid: string): Promise<User> => {
  const userDocRef = doc(db, "activeUsers", uid); // Reference to the user document
  const userDocSnap = await getDoc(userDocRef); // Get the document snapshot

  if (userDocSnap.exists()) {
    return userDocSnap.data() as User; // Return document data if exists
  } else {
    throw new Error("User not found"); // Throw an error if document doesn't exist
  }
};

export const useFetchUser = (uid: string) => {
  return useQuery<User, Error>({
    queryKey: ["user", uid],
    queryFn: () => fetchUser(uid),
    enabled: !!uid, // Ensure the query only runs if a valid uid is provided
    staleTime: 1000 * 60 * 5, // Keep data fresh for 5 minutes
    cacheTime: 1000 * 60 * 5, // Cache the data for 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};
