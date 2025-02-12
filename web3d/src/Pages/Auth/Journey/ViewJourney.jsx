import React, { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import {
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import AddJourney from "./AddJourney"; // Updated component import
import Modal from "../../../Components/UI/Modal/Modal";
import { deleteFilesFromSupabase } from "../../../utils/supabaseFIle";

const ViewJourney = () => {
  const [journeys, setJourneys] = useState([]);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchJourneys = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "journey"));
        const journeyList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by createdAt field, with a check for missing or invalid createdAt
        journeyList.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
          return dateA - dateB; // Sort in descending order
        });

        setJourneys(journeyList);
        setIsEdit(false);
      } catch (error) {
        console.error("Error fetching journeys: ", error);
      }
    };

    fetchJourneys();
  }, [isEdit]);

  const handleEdit = (id) => {
    // Find the journey data based on the id
    const journey = journeys.find((item) => item.id === id);
    console.log("Edit data on handle Edit", journey);
    setEditData(journey);
    setModal(true);
  };

  const handleEditSuccess = () => {
    console.log("Edit success");

    setModal(false);
    setIsEdit(true);
  };

  const handleDelete = async (id) => {
    try {
      const docRef = doc(db, "journey", id); // Get reference to the document
      console.log("Document reference:", docRef);

      // Try to fetch the document
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        console.error("Document not found.");
        enqueueSnackbar("Journey data not found.", { variant: "error" });
        return;
      }

      const journeyData = docSnapshot.data();
      console.log("Journey data:", journeyData);

      const fileUrls = journeyData.icons; // Assuming 'icons' stores the file URL
      console.log("File URL:", fileUrls);

      const deleteFile = await deleteFilesFromSupabase(fileUrls, "journey");
      console.log("Delete", deleteFile);

      await deleteDoc(doc(db, "journey", id));
      setJourneys(journeys.filter((journey) => journey.id !== id));
      enqueueSnackbar("Journey data deleted successfully!", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar("Failed to delete journey data. Please try again.", {
        variant: "error",
      });
    }
  };

  const handleCloseModal = () => {
    setModal(false); // Close modal
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Journeys</h1>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Title</th>
            <th className="px-4 py-2 text-left">Office</th>
            <th className="px-4 py-2 text-left">Designation</th>
            <th className="px-4 py-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {journeys.map((journey) => (
            <tr key={journey.id}>
              <td className="px-4 py-2">{journey.title}</td>
              <td className="px-4 py-2">{journey.office_name}</td>
              <td className="px-4 py-2">{journey.designation}</td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => handleEdit(journey.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(journey.id)}
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
        <Modal
          onClose={handleCloseModal}
          title={editData ? "Edit Journey" : "Add Journey"}
        >
          <div className="w-full">
            {/* This div will allow for scrolling if the content overflows */}
            <AddJourney
              editData={editData}
              handleEditSuccess={handleEditSuccess}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ViewJourney;
