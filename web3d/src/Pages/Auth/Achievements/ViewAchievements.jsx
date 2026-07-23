import React, { useState } from "react";
import { useSnackbar } from "notistack";
import AddAchievements from "./AddAchievements";
import Modal from "../../../Components/UI/Modal/Modal";
import { useAchievementsQuery } from "../../../Hooks/options/useAchievementsQuery";
import { useDeleteAchievement } from "../../../Hooks/mutations/useAchievementsMutations";

const ViewAchievements = () => {
  const { data: achievements = [] } = useAchievementsQuery();
  const deleteMutation = useDeleteAchievement();
  const { enqueueSnackbar } = useSnackbar();
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const achievementList = achievements.map((item) => ({ ...item, id: String(item.id) }));

  const handleEdit = (id) => {
    const achievement = achievementList.find((item) => String(item.id) === String(id));
    setEditData(achievement);
    setModal(true);
  };

  const handleEditSuccess = () => setModal(false);

  const handleDelete = (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        enqueueSnackbar("Achievement deleted successfully!", { variant: "success" });
      },
      onError: () => {
        enqueueSnackbar("Failed to delete achievement. Please try again.", { variant: "error" });
      },
    });
  };

  const handleCloseModal = () => setModal(false);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Achievements</h1>
        <button
          onClick={() => { setEditData(null); setModal(true); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          + Add Achievement
        </button>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Achievement Name</th>
              <th className="px-4 py-3 text-center font-semibold">Icon</th>
              <th className="px-4 py-3 text-left font-semibold">Description</th>
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {achievementList.map((achievement) => (
              <tr key={achievement.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{achievement.name}</td>
                <td className="px-4 py-3 text-center">
                  {achievement.icons ? (
                    <img
                      src={typeof achievement.icons === "string" ? achievement.icons : achievement.icons}
                      alt={achievement.name}
                      className="w-8 h-8 object-cover rounded mx-auto"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-3">{achievement.description}</td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(achievement.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(achievement.id)}
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
        {achievementList.map((achievement) => (
          <div key={achievement.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3">
                {achievement.icons && (
                  <img
                    src={typeof achievement.icons === "string" ? achievement.icons : achievement.icons}
                    alt={achievement.name}
                    className="w-10 h-10 object-cover rounded flex-shrink-0"
                  />
                )}
                <div>
                  <span className="text-sm font-semibold text-gray-600">Achievement:</span>
                  <p className="text-base">{achievement.name}</p>
                </div>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">Description:</span>
                <p className="text-base">{achievement.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(achievement.id)}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(achievement.id)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal onClose={handleCloseModal} title={editData ? "Edit Achievement" : "Add Achievement"}>
          <div className="w-full">
            <AddAchievements editData={editData} handleEditSuccess={handleEditSuccess} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ViewAchievements;
