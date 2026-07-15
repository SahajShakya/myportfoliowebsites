const Modal = ({ title, onClose, children, fullWidth = false, small = false }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
      <div
        className={`bg-white/90 backdrop-blur-md rounded-lg shadow-xl ${
          small
            ? "w-full sm:w-auto sm:max-w-sm"
            : fullWidth
            ? "w-full"
            : "w-full sm:w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%]"
        } ${small ? "" : "max-w-6xl"} max-h-[90vh] flex flex-col`}
      >
        {/* Modal header with title and close button */}
        <div className="flex justify-between items-center border-b border-gray-200/60 px-4 sm:px-5 py-3 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-700">{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl font-semibold text-gray-400 hover:text-gray-700 transition-colors leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-5 py-3">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
