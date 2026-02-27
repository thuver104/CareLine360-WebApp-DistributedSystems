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
    <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Symptom Triage</h2>
      <p className="text-sm text-gray-600 mb-3">
        Describe your symptoms to help us assess the priority of your appointment.
      </p>
      <textarea
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        placeholder="Describe your symptoms (e.g., headache, chest pain, fever...)"
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        onClick={handleAssess}
        disabled={!symptoms.trim()}
        className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
      >
        Assess Priority
      </button>

      {priority && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium">Priority:</span>
            <PriorityBadge priority={priority} />
          </div>
          <p className="text-sm text-gray-600">{getPriorityDescription(priority)}</p>
        </div>
      )}
    </div>
  );
}
