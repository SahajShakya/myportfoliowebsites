import React, { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import AddAcademicProjects from "./AddAcademicProjects";
import Modal from "../../../Components/UI/Modal/Modal";
import api from "../../../api/client";

const ViewAcademicProjects = () => {
  const [projects, setProjects] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.get("/academic_projects");
        const list = (data.data || []).map((item) => ({
          ...item,
          id: String(item.id),
        }));
        setProjects(list);
        setIsEdit(false);
      } catch (error) {
        console.error("Error fetching academic projects:", error);
      }
    };
    fetchProjects();
  }, [isEdit]);

  const handleEdit = (id) => {
    const project = projects.find((item) => String(item.id) === String(id));
    setEditData(project);
    setModal(true);
  };

  const handleEditSuccess = () => {
    setModal(false);
    setIsEdit(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/academic_projects/${id}`);
      setProjects(projects.filter((p) => String(p.id) !== String(id)));
      enqueueSnackbar("Academic project deleted!", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Failed to delete.", { variant: "error" });
    }
  };

  const handleCloseModal = () => setModal(false);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Academic Projects</h1>
        <button
          onClick={() => { setEditData(null); setModal(true); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          + Add Academic Project
        </button>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Project Name</th>
              <th className="px-4 py-3 text-center font-semibold">Icon</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{project.name}</td>
                <td className="px-4 py-3 text-center">
                  {project.icons ? (
                    <img
                      src={typeof project.icons === "string" ? project.icons : project.icons}
                      alt={project.name}
                      className="w-8 h-8 object-cover rounded mx-auto"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-3">{project.description}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleEdit(project.id)}
                    className="bg-blue-500 text-white px-3 py-1.5 rounded-md mr-2 hover:bg-blue-600 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
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

      <div className="md:hidden space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3">
                {project.icons && (
                  <img
                    src={typeof project.icons === "string" ? project.icons : project.icons}
                    alt={project.name}
                    className="w-10 h-10 object-cover rounded flex-shrink-0"
                  />
                )}
                <div>
                  <span className="text-sm font-semibold text-gray-600">Project Name:</span>
                  <p className="text-base">{project.name}</p>
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">Description:</span>
                <p className="text-base">{project.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(project.id)}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(project.id)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal onClose={handleCloseModal} title={editData ? "Edit Academic Project" : "Add Academic Project"}>
          <div className="w-full">
            <AddAcademicProjects editData={editData} handleEditSuccess={handleEditSuccess} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ViewAcademicProjects;
