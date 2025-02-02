const Modal = ({ title, onClose, children, fullWidth = false }) => {
  return (
    <div className="flex items-center justify-center bg-gray-500 bg-opacity-50 z-50 absolute top-21 left-0 w-full h-full ">
      <div
        className={`bg-white p-6 rounded-md shadow-lg ${
          fullWidth ? "w-full" : "w-96"
        } max-w-4xl mx-4`}
      >
        {/* Modal header with title and close button */}
        <div className="flex justify-between items-center border-b pb-2">
          <div className="text-xl font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="text-xl font-semibold text-gray-700 hover:text-gray-900"
          >
            &times;
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="mt-4 max-h-[calc(100vh-160px)] overflow-y">
          {/* Wrap the children (AddAcademics) here in a scrollable container */}
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
