import React, { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
import {
  collection,
  getDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { useSnackbar } from "notistack";
import AddProjects from "./AddProjects";
import Modal from "../../../Components/UI/Modal/Modal";
import { deleteFilesFromSupabase } from "../../../utils/supabaseFIle";

const ViewProjects = () => {
  const [projects, setProjects] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "projects"));
        const projectList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects: ", error);
      }
    };

    fetchProjects();
  }, []);

  const handleEdit = (id) => {
    const project = projects.find((item) => item.id === id);
    setEditData(project);
    setModal(true);
  };

  const handleDelete = async (id) => {
    try {
      // Step 1: Get the project data
      const docRef = doc(db, "projects", id);
      const projectSnapshot = await getDoc(docRef);
      const projectData = projectSnapshot.data();

      // console.log("Project Data", projectData);

      if (!projectData) {
        throw new Error("Project not found");
      }

      // Step 2: Get the publicUrl from the icons array
      const { icons } = projectData;

      // console.log("Icons", icons);
      const publicUrl = icons?.publicUrl; // Directly access the publicUrl

      if (!publicUrl) {
        throw new Error("No public URL found in icons object");
      }
      // console.log("Public URLs", publicUrl);

      // Step 3: Delete the images from Supabase
      // await deleteFilesFromSupabase(publicUrls, "projects");

      // Step 4: Delete related projectDetails documents
      const projectDetailsQuery = collection(db, "projectDetails");
      const projectDetailsSnapshot = await getDocs(projectDetailsQuery);

      console.log("Project ID", id);

      const projectDetailsToDelete = projectDetailsSnapshot.docs.filter(
        (doc) => {
          const data = doc.data();
          // console.log("Project Detail data id", data.project_id);
          return data.project_id && data.project_id == id;
        }
      );

      // console.log("Filtered Project Details to Delete", projectDetailsToDelete);

      // console.log("Project Details to Delete", projectDetailsSnapshot);

      // Delete each projectDetails document
      // Step 5: For each projectDetails document, delete the images inside `icons`
      for (const detailDoc of projectDetailsToDelete) {
        const detailData = detailDoc.data();
        if (detailData && detailData.icons) {
          // Extract publicUrls inside the `icons` array for the current projectDetails document
          console.log("Detail Data", detailData);
          const detailPublicUrls = detailData.icons.map(
            (icon) => icon.publicUrl
          );

          // console.log("Detail Public URLs", detailPublicUrls);

          // Delete the images from Supabase
          if (detailPublicUrls.length > 0) {
            console.log(
              "Deleting images for projectDetails document:",
              detailDoc.id
            );
            await deleteFilesFromSupabase(detailPublicUrls, "projects");
          }
        }

        // After deleting the images, delete the projectDetails document
        // console.log("Deleting projectDetails document:", detailDoc.id);
        await deleteDoc(doc(db, "projectDetails", detailDoc.id));
      }

      await deleteFilesFromSupabase(publicUrl, "projects");

      // Step 5: Delete the project document
      await deleteDoc(docRef);

      // Update the state to remove the project from the UI
      setProjects(projects.filter((project) => project.id !== id));

      // Notify the user of success
      enqueueSnackbar("Project deleted successfully!", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to delete project. Please try again.", {
        variant: "error",
      });
      console.error("Error deleting project:", error);
    }
  };

  const handleCloseModal = () => setModal(false);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Projects</h1>
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Project Name</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td className="px-4 py-2">{project.name}</td>
              <td className="px-4 py-2">{project.description}</td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => handleEdit(project.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
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
        <Modal onClose={handleCloseModal} title="Edit Project">
          <AddProjects
            editData={editData}
            handleEditSuccess={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

export default ViewProjects;
