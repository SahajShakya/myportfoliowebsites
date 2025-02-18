import { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, getDoc, deleteDoc, getDocs } from "firebase/firestore";
import { useSnackbar } from "notistack";
import AddAchievements from "./AddAchievements"; // Make sure you have this component
import Modal from "../../../Components/UI/Modal/Modal";
import { deleteFilesFromSupabase } from "../../../utils/supabaseFIle";

const ViewAchievements = () => {
  const [achievements, setAchievements] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "achievements"));
        const achievementsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAchievements(achievementsList);
      } catch (error) {
        console.error("Error fetching achievements: ", error);
      }
    };

    fetchAchievements();
  }, []);

  const handleEdit = (id) => {
    const achievement = achievements.find((item) => item.id === id);
    setEditData(achievement);
    setModal(true);
  };

  const handleDelete = async (id) => {
    try {
      // Step 1: Get the achievement data
      const docRef = doc(db, "achievements", id);
      const achievementSnapshot = await getDoc(docRef);
      const achievementData = achievementSnapshot.data();

      if (!achievementData) {
        throw new Error("Achievement not found");
      }

      // Step 2: Get the publicUrl from the images array
      const { icons } = achievementData;
      //   console.log("images", icons);
      const publicUrl = icons?.publicUrl; // Directly access the publicUrl

      if (!publicUrl) {
        throw new Error("No public URL found in images object");
      }

      // Step 3: Delete the images from Supabase
      await deleteFilesFromSupabase(publicUrl, "achievements");

      // Step 4: Delete related achievementDetails documents
      const achievementDetailsQuery = collection(db, "achievementDetails");
      const achievementDetailsSnapshot = await getDocs(achievementDetailsQuery);

      const achievementDetailsToDelete = achievementDetailsSnapshot.docs.filter(
        (doc) => {
          const data = doc.data();
          return data.achievement_id && data.achievement_id === id;
        }
      );

      // Delete each achievementDetails document
      for (const detailDoc of achievementDetailsToDelete) {
        const detailData = detailDoc.data();
        if (detailData && detailData.icons) {
          // Extract publicUrls inside the `images` array for the current achievementDetails document
          const detailPublicUrls = detailData.icons.map(
            (img) => img?.publicUrl
          );

          // Delete the images from Supabase
          if (detailPublicUrls.length > 0) {
            await deleteFilesFromSupabase(detailPublicUrls, "achievements");
          }
        }

        // After deleting the images, delete the achievementDetails document
        await deleteDoc(doc(db, "achievementDetails", detailDoc.id));
      }

      // Step 5: Delete the achievement document
      await deleteDoc(docRef);

      // Update the state to remove the achievement from the UI
      setAchievements(
        achievements.filter((achievement) => achievement.id !== id)
      );

      // Notify the user of success
      enqueueSnackbar("Achievement deleted successfully!", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar("Failed to delete achievement. Please try again.", {
        variant: "error",
      });
      console.error("Error deleting achievement:", error);
    }
  };

  const handleCloseModal = () => setModal(false);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Achievements</h1>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Achievement Name</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {achievements.map((achievement) => (
            <tr key={achievement.id}>
              <td className="px-4 py-2">{achievement.name}</td>
              <td className="px-4 py-2">{achievement.description}</td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => handleEdit(achievement.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(achievement.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <Modal onClose={handleCloseModal} title="Edit Achievement">
          <AddAchievements
            editData={editData}
            handleEditSuccess={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default ViewAchievements;
