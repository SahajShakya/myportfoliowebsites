import React, { useState } from "react";
import { useSnackbar } from "notistack";
import AddProjects from "./AddProjects";
import Modal from "../../../Components/UI/Modal/Modal";
import { useProjectsQuery } from "../../../Hooks/options/useProjectsQuery";
import { useDeleteProject } from "../../../Hooks/mutations/useProjectsMutations";

const ViewProjects = () => {
  const { data: projects = [] } = useProjectsQuery();
  const deleteMutation = useDeleteProject();
  const { enqueueSnackbar } = useSnackbar();
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const projectList = projects.map((item) => ({ ...item, id: String(item.id) }));

  const handleEdit = (id) => {
    const project = projectList.find((item) => String(item.id) === String(id));
    setEditData(project);
    setModal(true);
  };

  const handleEditSuccess = () => setModal(false);

  const handleDelete = (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        enqueueSnackbar("Project deleted successfully!", { variant: "success" });
      },
      onError: () => {
        enqueueSnackbar("Failed to delete project. Please try again.", { variant: "error" });
      },
    });
  };

  const handleCloseModal = () => setModal(false);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Projects</h1>
        <button
          onClick={() => { setEditData(null); setModal(true); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          + Add Project
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
            {projectList.map((project) => (
              <tr key={project.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{project.name}</td>
                <td className="px-4 py-3 text-center">
                  {project.icons && project.icons.length > 0 ? (
                    <div className="flex justify-center gap-1 flex-wrap">
                      {project.icons.map((icon, idx) => (
                        <img
                          key={idx}
                          src={typeof icon === "string" ? icon : icon.icon_url || ""}
                          alt={`Icon ${idx}`}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-3">{project.description}</td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(project.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {projectList.map((project) => (
          <div key={project.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3">
                {project.icons && project.icons.length > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {project.icons.map((icon, idx) => (
                      <img
                        key={idx}
                        src={typeof icon === "string" ? icon : icon.icon_url || ""}
                        alt={`Icon ${idx}`}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ))}
                  </div>
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
        <Modal onClose={handleCloseModal} title={editData ? "Edit Project" : "Add Project"}>
          <div className="w-full">
            <AddProjects editData={editData} handleEditSuccess={handleEditSuccess} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ViewProjects;
