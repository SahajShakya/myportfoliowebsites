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
import AddAcademics from "./AddAcademics";
import Modal from "../../../Components/UI/Modal/Modal";
import { deleteFilesFromSupabase } from "../../../utils/supabaseFIle";

const ViewAcademics = () => {
  const [academics, setAcademics] = useState([]);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchAcademics = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "academics"));
        const academicList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort by createdAt field, with a check for missing or invalid createdAt
        academicList.sort((a, b) => {
          // Fallback to current date if createdAt is missing or invalid
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
          return dateA - dateB; // Sort in descending order
        });

        setAcademics(academicList);
        setIsEdit(false);
      } catch (error) {
        console.error("Error fetching academics: ", error);
      }
    };

    fetchAcademics();
  }, [isEdit]);

  const handleEdit = (id) => {
    // Find the academic data based on the id
    const academic = academics.find((item) => item.id === id);

    console.log("Edit data on handle Edit", academic);
    setEditData(academic);
    setModal(true);
  };

  const handleEditSuccess = () => {
    console.log("Edit success");

    setModal(false);
    setIsEdit(true);
  };

  const handleDelete = async (id) => {
    try {
      const docRef = doc(db, "academics", id); // Get reference to the document
      console.log("Document reference:", docRef);

      // Try to fetch the document
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        console.error("Document not found.");
        enqueueSnackbar("Academic data not found.", { variant: "error" });
        return;
      }

      const academicData = docSnapshot.data();
      console.log("Academic data:", academicData); // Check if data is being fetched

      const fileUrls = academicData.icons; // Assuming 'icon' stores the file URL
      console.log("File URL:", fileUrls);
      // console.log("Doc Snapshot", fileUrl);
      const deleteFile = await deleteFilesFromSupabase(fileUrls, "academics");
      console.log("Delete", deleteFile);

      await deleteDoc(doc(db, "academics", id));
      setAcademics(academics.filter((academic) => academic.id !== id));
      enqueueSnackbar("Academic data deleted successfully!", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar("Failed to delete academic data. Please try again.", {
        variant: "error",
      });
    }
  };

  const handleCloseModal = () => {
    setModal(false); // Close modal
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Academics</h1>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Title</th>
            <th className="px-4 py-2 text-left">University</th>
            <th className="px-4 py-2 text-left">College</th>
            <th className="px-4 py-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {academics.map((academic) => (
            <tr key={academic.id}>
              <td className="px-4 py-2">{academic.title}</td>
              <td className="px-4 py-2">{academic.university_name}</td>
              <td className="px-4 py-2">{academic.college_name}</td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => handleEdit(academic.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(academic.id)}
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
          title={editData ? "Edit Academic" : "Add Academic"}
        >
          <div className="w-full">
            {/* This div will allow for scrolling if the content overflows */}
            <AddAcademics
              editData={editData}
              handleEditSuccess={handleEditSuccess}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ViewAcademics;
