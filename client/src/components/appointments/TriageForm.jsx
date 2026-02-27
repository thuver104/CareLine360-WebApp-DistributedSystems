import { useState } from "react";
import { assessPriority, getPriorityDescription } from "../../utils/triageLogic";

const PRIORITY_RESULT_STYLE = {
  urgent: {
    bg: "bg-red-50",
    ring: "ring-red-200/60",
    dot: "bg-red-500",
    text: "text-red-600",
    label: "Urgent",
  },
  high: {
    bg: "bg-orange-50",
    ring: "ring-orange-200/60",
    dot: "bg-orange-500",
    text: "text-orange-600",
    label: "High",
  },
  medium: {
    bg: "bg-amber-50",
    ring: "ring-amber-200/60",
    dot: "bg-amber-400",
    text: "text-amber-600",
    label: "Medium",
  },
  low: {
    bg: "bg-emerald-50",
    ring: "ring-emerald-200/60",
    dot: "bg-emerald-400",
    text: "text-emerald-600",
    label: "Low",
  },
};

export default function TriageForm({ onAssess }) {
  const [symptoms, setSymptoms] = useState("");
  const [priority, setPriority] = useState(null);

  const handleAssess = () => {
    const result = assessPriority(symptoms);
    setPriority(result);
    onAssess(symptoms, result);
  };

  const style = priority ? PRIORITY_RESULT_STYLE[priority] : null;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-black/[0.04] shadow-sm p-5 mb-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
          <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">Symptom Triage</h2>
          <p className="text-[11px] text-gray-400">Describe your symptoms to assess priority</p>
        </div>
      </div>

      {/* Textarea */}
      <div className="relative mb-3">
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g. headache, chest pain, fever, cough..."
          rows={3}
          className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-300 resize-none transition-shadow"
        />
        <div className="absolute bottom-2.5 right-3 text-[10px] text-gray-300">
          {symptoms.length > 0 && `${symptoms.length} chars`}
        </div>
      </div>

      {/* Assess button */}
      <button
        onClick={handleAssess}
        disabled={!symptoms.trim()}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Assess Priority
      </button>

      {/* Result */}
      {priority && style && (
        <div className={`mt-4 rounded-xl ${style.bg} ring-1 ${style.ring} p-4 flex items-start gap-3`}>
          <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
            <span className={`w-3 h-3 rounded-full ${style.dot}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs font-bold ${style.text} uppercase tracking-wider`}>{style.label} Priority</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{getPriorityDescription(priority)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
