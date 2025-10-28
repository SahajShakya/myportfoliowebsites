const Modal = ({ title, onClose, children, fullWidth = false }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-xl ${
          fullWidth ? "w-full" : "w-full sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%]"
        } max-w-6xl max-h-[90vh] flex flex-col`}
      >
        {/* Modal header with title and close button */}
        <div className="flex justify-between items-center border-b px-4 sm:px-6 py-4 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-3xl font-semibold text-gray-500 hover:text-gray-800 transition-colors leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
