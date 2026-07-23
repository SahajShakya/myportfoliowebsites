import React, { useState } from "react";
import { useSnackbar } from "notistack";
import AddAcademics from "./AddAcademics";
import Modal from "../../../Components/UI/Modal/Modal";
import { useAcademicsQuery } from "../../../Hooks/options/useAcademicsQuery";
import { useDeleteAcademic } from "../../../Hooks/mutations/useAcademicsMutations";

const ViewAcademics = () => {
  const { data: academics = [] } = useAcademicsQuery();
  const deleteMutation = useDeleteAcademic();
  const { enqueueSnackbar } = useSnackbar();
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const sortedAcademics = [...academics]
    .map((item) => ({ ...item, id: String(item.id) }))
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const handleEdit = (id) => {
    const academic = sortedAcademics.find((item) => String(item.id) === String(id));
    setEditData(academic);
    setModal(true);
  };

  const handleEditSuccess = () => setModal(false);

  const handleDelete = async (id) => {
    try {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          enqueueSnackbar("Academic data deleted successfully!", { variant: "success" });
        },
        onError: (error) => {
          const msg = error?.response?.data?.error || error?.message || "Failed to delete academic data. Please try again.";
          console.error("Delete academic failed:", error);
          enqueueSnackbar(msg, { variant: "error" });
        },
      });
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || "Failed to delete academic data. Please try again.";
      console.error("Delete academic failed:", error);
      enqueueSnackbar(msg, { variant: "error" });
    }
  };

  const handleCloseModal = () => setModal(false);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Academics</h1>
        <button
          onClick={() => { setEditData(null); setModal(true); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          + Add Academics
        </button>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-center font-semibold">Icon</th>
              <th className="px-4 py-3 text-left font-semibold">University</th>
              <th className="px-4 py-3 text-left font-semibold">College</th>
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedAcademics.map((academic) => (
              <tr key={academic.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{academic.title}</td>
                <td className="px-4 py-3 text-center">
                  {academic.icons && academic.icons.length > 0 ? (
                    <div className="flex justify-center gap-1 flex-wrap">
                      {academic.icons.map((icon, idx) => (
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
                <td className="px-4 py-3">{academic.university_name}</td>
                <td className="px-4 py-3">{academic.college_name}</td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(academic.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(academic.id)}
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
        {sortedAcademics.map((academic) => (
          <div key={academic.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3">
                {academic.icons && academic.icons.length > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {academic.icons.map((icon, idx) => (
                      <img
                        key={idx}
                        src={typeof icon === "string" ? icon : icon.icon_url || icon}
                        alt={`Icon ${idx}`}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
                <div>
                  <span className="text-sm font-semibold text-gray-600">Title:</span>
                  <p className="text-base">{academic.title}</p>
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">University:</span>
                <p className="text-base">{academic.university_name}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">College:</span>
                <p className="text-base">{academic.college_name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(academic.id)}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(academic.id)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal onClose={handleCloseModal} title={editData ? "Edit Academic" : "Add Academic"}>
          <div className="w-full">
            <AddAcademics editData={editData} handleEditSuccess={handleEditSuccess} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ViewAcademics;
