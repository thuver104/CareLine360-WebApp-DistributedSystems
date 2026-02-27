import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createMedicalRecord } from "../../api/doctorApi";

const VITALS_FIELDS = [
  { key: "bloodPressure", label: "Blood Pressure", placeholder: "120/80" },
  {
    key: "heartRate",
    label: "Heart Rate (bpm)",
    placeholder: "72",
    type: "number",
  },
  {
    key: "temperature",
    label: "Temperature (°C)",
    placeholder: "37.0",
    type: "number",
  },
  {
    key: "oxygenSaturation",
    label: "O₂ Saturation (%)",
    placeholder: "98",
    type: "number",
  },
  { key: "weight", label: "Weight (kg)", placeholder: "65", type: "number" },
  { key: "height", label: "Height (cm)", placeholder: "170", type: "number" },
];

const emptyMed = () => ({
  medicine: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

export default function MedicalRecordModal({
  patientId,
  appointmentId,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    chiefComplaint: "",
    diagnosis: "",
    notes: "",
    vitals: {},
    prescriptions: [emptyMed()],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  const setField = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));
  const setVital = (key) => (e) =>
    setForm((p) => ({ ...p, vitals: { ...p.vitals, [key]: e.target.value } }));

  const setMed = (i, key) => (e) => {
    const meds = [...form.prescriptions];
    meds[i] = { ...meds[i], [key]: e.target.value };
    setForm((p) => ({ ...p, prescriptions: meds }));
  };

  const addMed = () =>
    setForm((p) => ({ ...p, prescriptions: [...p.prescriptions, emptyMed()] }));
  const removeMed = (i) =>
    setForm((p) => ({
      ...p,
      prescriptions: p.prescriptions.filter((_, idx) => idx !== i),
    }));

  const handleSave = async () => {
    if (!patientId) return setError("Patient ID is required");
    setSaving(true);
    setError("");
    try {
      await createMedicalRecord({ patientId, appointmentId, ...form });
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "88vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">
            Add Medical Record
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <Textarea
            label="Chief Complaint"
            value={form.chiefComplaint}
            onChange={setField("chiefComplaint")}
            placeholder="Primary reason for visit"
          />
          <Textarea
            label="Diagnosis"
            value={form.diagnosis}
            onChange={setField("diagnosis")}
            placeholder="Clinical diagnosis"
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={setField("notes")}
            placeholder="Additional clinical notes"
          />

          {/* Vitals */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              Vitals
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {VITALS_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-gray-500 mb-1 block">
                    {f.label}
                  </label>
                  <input
                    type={f.type || "text"}
                    value={form.vitals[f.key] || ""}
                    onChange={setVital(f.key)}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Medications
              </h3>
              <button
                onClick={addMed}
                className="text-teal-600 text-sm hover:underline"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {form.prescriptions.map((med, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between mb-3">
                    <p className="text-xs font-medium text-gray-500">
                      Medication #{i + 1}
                    </p>
                    {form.prescriptions.length > 1 && (
                      <button
                        onClick={() => removeMed(i)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["medicine", "dosage", "frequency", "duration"].map(
                      (k) => (
                        <input
                          key={k}
                          value={med[k]}
                          onChange={setMed(i, k)}
                          placeholder={k.charAt(0).toUpperCase() + k.slice(1)}
                          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      ),
                    )}
                    <input
                      value={med.instructions}
                      onChange={setMed(i, "instructions")}
                      placeholder="Instructions"
                      className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2"
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {saving ? "Saving…" : "Save Record"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Textarea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      <textarea
        rows={2}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
      />
    </div>
  );
}
