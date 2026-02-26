import { useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

const ICONS  = { success: CheckCircle, error: XCircle, info: Info, warning: AlertTriangle };
const COLORS = {
  success: "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200",
  error:   "border-rose-400   bg-rose-50   dark:bg-rose-900/30   text-rose-800   dark:text-rose-200",
  info:    "border-blue-400   bg-blue-50   dark:bg-blue-900/30   text-blue-800   dark:text-blue-200",
  warning: "border-amber-400  bg-amber-50  dark:bg-amber-900/30  text-amber-800  dark:text-amber-200",
};
const ICON_COLORS = {
  success: "text-emerald-500",
  error:   "text-rose-500",
  info:    "text-blue-500",
  warning: "text-amber-500",
};

let _add = null;
export function useToast() {
  const toast = useCallback((message, type = "success") => {
    _add?.({ message, type, id: Date.now() + Math.random() });
  }, []);
  return { toast };
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _add = (t) => setToasts((prev) => [...prev, t]);
    return () => { _add = null; };
  }, []);

  const remove = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={remove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const Icon = ICONS[toast.type] || CheckCircle;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3200);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl border-l-4
        shadow-xl backdrop-blur-sm min-w-[260px] max-w-[340px] animate-fade-in
        ${COLORS[toast.type]}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${ICON_COLORS[toast.type]}`} />
      <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
