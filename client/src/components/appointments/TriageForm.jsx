import { useState } from "react";
import { assessPriority, getPriorityDescription } from "../../utils/triageLogic";
import { PriorityBadge } from "../ui/StatusBadge";

export default function TriageForm({ onAssess }) {
  const [symptoms, setSymptoms] = useState("");
  const [priority, setPriority] = useState(null);

  const handleAssess = () => {
    const result = assessPriority(symptoms);
    setPriority(result);
    onAssess(symptoms, result);
  };

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Symptom Triage</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Describe your symptoms to help us assess the priority of your appointment.
      </p>
      <textarea
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        placeholder="Describe your symptoms (e.g., headache, chest pain, fever...)"
        rows={3}
        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition shadow-sm"
      />
      <button
        onClick={handleAssess}
        disabled={!symptoms.trim()}
        className="mt-3 px-4 py-2 bg-[#0d9488] text-white text-sm rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
      >
        Assess Priority
      </button>

      {priority && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority:</span>
            <PriorityBadge priority={priority} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{getPriorityDescription(priority)}</p>
        </div>
      )}
    </div>
  );
}
