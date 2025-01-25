
const Modal = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-md shadow-lg w-96">
        <div className="flex justify-between items-center">
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
