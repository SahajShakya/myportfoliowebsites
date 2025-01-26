const Modal = ({ title, onClose, children, fullWidth = false }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
      <div
        className={`bg-white p-6 rounded-md shadow-lg ${
          fullWidth ? "w-full" : "w-96"
        } max-w-4xl mx-4`}
      >
        <div className="flex justify-between items-center border-b pb-2">
          <div className="text-xl font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="text-xl font-semibold text-gray-700 hover:text-gray-900"
          >
            &times;
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
