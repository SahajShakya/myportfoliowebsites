import React, { useState } from "react";
import { useSnackbar } from "notistack";
import AddJourney from "./AddJourney";
import Modal from "../../../Components/UI/Modal/Modal";
import { useJourneyQuery } from "../../../Hooks/options/useJourneyQuery";
import { useDeleteJourney } from "../../../Hooks/mutations/useJourneyMutations";

const ViewJourney = () => {
  const { data: journeys = [] } = useJourneyQuery();
  const deleteMutation = useDeleteJourney();
  const { enqueueSnackbar } = useSnackbar();
  const [modal, setModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const sortedJourneys = [...journeys]
    .map((item) => ({ ...item, id: String(item.id) }))
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  const handleEdit = (id) => {
    const journey = sortedJourneys.find((item) => String(item.id) === String(id));
    setEditData(journey);
    setModal(true);
  };

  const handleEditSuccess = () => setModal(false);

  const handleDelete = (id) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        enqueueSnackbar("Journey deleted successfully!", { variant: "success" });
      },
      onError: () => {
        enqueueSnackbar("Failed to delete journey. Please try again.", { variant: "error" });
      },
    });
  };

  const handleCloseModal = () => setModal(false);

  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Journeys</h1>
        <button
          onClick={() => { setEditData(null); setModal(true); }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          + Add Journey
        </button>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-center font-semibold">Icon</th>
              <th className="px-4 py-3 text-left font-semibold">Office</th>
              <th className="px-4 py-3 text-left font-semibold">Designation</th>
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedJourneys.map((journey) => (
              <tr key={journey.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{journey.title}</td>
                <td className="px-4 py-3 text-center">
                  {journey.icons && journey.icons.length > 0 ? (
                    <div className="flex justify-center gap-1 flex-wrap">
                      {journey.icons.map((icon, idx) => (
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
                <td className="px-4 py-3">{journey.office_name}</td>
                <td className="px-4 py-3">{journey.designation}</td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(journey.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(journey.id)}
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
        {sortedJourneys.map((journey) => (
          <div key={journey.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-3">
                {journey.icons && journey.icons.length > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {journey.icons.map((icon, idx) => (
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
                  <span className="text-sm font-semibold text-gray-600">Title:</span>
                  <p className="text-base">{journey.title}</p>
                </div>
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
        <Modal onClose={handleCloseModal} title={editData ? "Edit Journey" : "Add Journey"}>
          <div className="w-full">
            <AddJourney editData={editData} handleEditSuccess={handleEditSuccess} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ViewJourney;
