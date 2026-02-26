import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ClipboardList,
  Activity,
  Pill,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { getPatientRecords } from "../../api/doctorApi";
import { getInitials } from "../../utils/colors";

const VITAL_LABELS = {
  bloodPressure: "Blood Pressure",
  heartRate: "Heart Rate (bpm)",
  temperature: "Temperature (°C)",
  oxygenSaturation: "O₂ Saturation (%)",
  weight: "Weight (kg)",
  height: "Height (cm)",
};

function VitalsSection({ vitals }) {
  const entries = Object.entries(vitals || {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (entries.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
        <Activity className="h-3 w-3" /> Vitals
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="rounded-lg px-3 py-2 bg-white/40 dark:bg-white/5 border border-gray-100 dark:border-white/10"
          >
            <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-none mb-1">
              {VITAL_LABELS[key] || key}
            </p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              {val}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrescriptionsSection({ prescriptions }) {
  if (!prescriptions?.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
        <Pill className="h-3 w-3" /> Prescriptions ({prescriptions.length})
      </p>
      <div className="space-y-2">
        {prescriptions.map((rx, i) => (
          <div
            key={i}
            className="rounded-lg px-3 py-2 bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20"
          >
            <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
              {rx.medicine || "—"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {[rx.dosage, rx.frequency, rx.duration]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {rx.instructions && (
              <p className="text-[11px] text-gray-400 mt-0.5 italic">
                {rx.instructions}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RecordCard({ record, index }) {
  const [open, setOpen] = useState(index === 0); // first record expanded by default

  const dateStr = record.createdAt
    ? new Date(record.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  const hasVitals = Object.values(record.vitals || {}).some(
    (v) => v !== null && v !== undefined && v !== "",
  );
  const hasPrescriptions = record.prescriptions?.length > 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/30 dark:bg-white/5 overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
              {dateStr}
            </span>
            {hasPrescriptions && (
              <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Pill className="h-2.5 w-2.5" /> Rx
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold text-gray-900 dark:text-white truncate">
            {record.diagnosis || "No diagnosis recorded"}
          </p>
          {record.chiefComplaint && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {record.chiefComplaint}
            </p>
          )}
        </div>
        <div className="shrink-0 text-gray-400 mt-0.5">
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/10 pt-3 space-y-3">
          {record.notes && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
                <FileText className="h-3 w-3" /> Notes
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {record.notes}
              </p>
            </div>
          )}
          {hasVitals && <VitalsSection vitals={record.vitals} />}
          {hasPrescriptions && (
            <PrescriptionsSection prescriptions={record.prescriptions} />
          )}
          {!record.notes && !hasVitals && !hasPrescriptions && (
            <p className="text-xs text-gray-400 italic">
              No additional details recorded.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatientRecordsModal({
  patientId,
  patientName,
  onClose,
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lock body scroll
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  // Fetch records
  useEffect(() => {
    if (!patientId) {
      setError("No patient linked to this appointment.");
      setLoading(false);
      return;
    }
    getPatientRecords(patientId)
      .then(({ data }) => setRecords(data.records || []))
      .catch(() => setError("Failed to load medical records."))
      .finally(() => setLoading(false));
  }, [patientId]);

  // Close on Escape
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-6 pb-6 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col glass-card rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-teal-400/20 shrink-0">
              {getInitials(patientName || "P")}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {patientName || "Patient"}
              </h2>
              <p className="text-xs text-gray-400">Past Medical Records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 dark:border-white/10 p-4 animate-pulse space-y-2"
                >
                  <div className="h-3 rounded bg-gray-200 dark:bg-white/10 w-1/4" />
                  <div className="h-4 rounded bg-gray-200 dark:bg-white/10 w-2/3" />
                  <div className="h-3 rounded bg-gray-200 dark:bg-white/10 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-rose-400 opacity-60" />
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <ClipboardList className="h-10 w-10 text-gray-300 dark:text-white/20" />
              <p className="text-sm font-medium text-gray-500">
                No medical records found
              </p>
              <p className="text-xs text-gray-400">
                Records will appear here after appointments are completed.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400">
                {records.length} record{records.length !== 1 ? "s" : ""} found
              </p>
              {records.map((rec, i) => (
                <RecordCard key={rec._id} record={rec} index={i} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
