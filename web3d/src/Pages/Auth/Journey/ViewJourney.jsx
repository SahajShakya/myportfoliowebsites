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
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6">Journeys</h1>
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Office</th>
              <th className="px-4 py-3 text-left font-semibold">Designation</th>
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {journeys.map((journey) => (
              <tr key={journey.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{journey.title}</td>
                <td className="px-4 py-3">{journey.office_name}</td>
                <td className="px-4 py-3">{journey.designation}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleEdit(journey.id)}
                    className="bg-blue-500 text-white px-3 py-1.5 rounded-md mr-2 hover:bg-blue-600 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(journey.id)}
                    className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {journeys.map((journey) => (
          <div key={journey.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="space-y-2 mb-4">
              <div>
                <span className="text-sm font-semibold text-gray-600">Title:</span>
                <p className="text-base">{journey.title}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">Office:</span>
                <p className="text-base">{journey.office_name}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">Designation:</span>
                <p className="text-base">{journey.designation}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(journey.id)}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(journey.id)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
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
