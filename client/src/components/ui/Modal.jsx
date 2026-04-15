export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} style={{ animation: "fadeIn 0.15s ease-out" }}></div>
      <div className="relative glass-card rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6" style={{ animation: "scaleIn 0.2s ease-out" }}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg w-8 h-8 flex items-center justify-center text-xl leading-none transition">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
