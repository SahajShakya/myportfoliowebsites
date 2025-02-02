import React, { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { deleteFileFromSupabase } from "../../../utils/supabaseFile"; // Import a helper function for file deletion from Supabase

const ViewAcademics = () => {
  const [academics, setAcademics] = useState([]);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchAcademics = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "academics"));
        const academicList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by createdAt field in descending order
        academicList.sort(
          (a, b) => a.createdAt.toDate() - b.createdAt.toDate()
        );
        setAcademics(academicList);
      } catch (error) {
        console.error("Error fetching academics: ", error);
      }
    };

    fetchAcademics();
  }, []);

  const handleEdit = (id) => {
    // Find the academic data based on the id
    const academic = academics.find((item) => item.id === id);

    if (!academic) {
      console.error("Academic data not found for ID:", id);
      return;
    }

    // Redirect to the AddAcademics page and pass the academic data along with isEdit flag
    navigate("/auth/academics/create", {
      state: { academicData: academic, isEdit: true },
    });
  };

  const handleDelete = async (id, icons) => {
    try {
      // Delete the icons from Supabase first
      if (icons && icons.length > 0) {
        await Promise.all(
          icons.map(async (iconUrl) => {
            // Delete the file from Supabase
            await deleteFileFromSupabase(iconUrl); // Assuming `deleteFileFromSupabase` is a utility function
          })
        );
      }

      // Now delete the document from Firestore
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Academics</h1>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th>Title</th>
            <th>University</th>
            <th>College</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {academics.map((academic) => (
            <tr key={academic.id}>
              <td>{academic.title}</td>
              <td>{academic.university_name}</td>
              <td>{academic.college_name}</td>
              <td>
                <button
                  onClick={() => handleEdit(academic.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(academic.id, academic.icons)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md ml-2"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewAcademics;
