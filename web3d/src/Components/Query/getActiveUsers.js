import { useQuery, useQueryClient } from "react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase"; // Import your Firestore instance

// Function to fetch user data from Firestore by UID
const fetchActiveUser = async (uid) => {
  const userDocRef = doc(db, "activeUsers", uid); // Document reference to the specific UID in the "activeUsers" collection
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data(); // Return the document data
  } else {
    throw new Error("User not found");
  }
};

// Custom hook to fetch the active user by UID
export const useActiveUser = (uid) => {
  const queryClient = useQueryClient();

  // Check if data is already in the cache
  const cachedData = queryClient.getQueryData(["activeUser", uid]);

  // If cached data exists, return it immediately
  if (cachedData) {
    return { data: cachedData, isLoading: false, isError: false };
  }

  // If no cached data, perform the query
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery(
    ["activeUser", uid], // Unique key for caching the query
    () => fetchActiveUser(uid), // Ensure the uid is a valid string
    {
      enabled: !!uid, // Only fetch data if UID is provided
      retry: false, // Disable retries for this query (optional)
      onError: (error) => {
        console.error("Error fetching active user:", error.message);
      },
      onSuccess: (data) => {
        // Optionally, you can cache the data manually if needed
        queryClient.setQueryData(["activeUser", uid], data);
      },
      // Optional: You can control cache timing, etc., by adding more options like staleTime, cacheTime, etc.
    }
  );
};
