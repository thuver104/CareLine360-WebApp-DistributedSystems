const TRIAGE_RULES = [
  { keywords: ["chest pain", "heart attack", "breathing difficulty", "unconscious", "stroke", "seizure"], priority: "urgent" },
  { keywords: ["fever", "severe pain", "bleeding", "fracture", "burn", "vomiting"], priority: "high" },
  { keywords: ["headache", "cough", "cold", "sore throat", "fatigue", "dizziness", "nausea"], priority: "medium" },
];

export function assessPriority(symptoms) {
  if (!symptoms) return "low";

  const lower = symptoms.toLowerCase();

  for (const rule of TRIAGE_RULES) {
    for (const keyword of rule.keywords) {
      if (lower.includes(keyword)) {
        return rule.priority;
      }
    }
  }

  return "low";
}

export function getPriorityDescription(priority) {
  const descriptions = {
    urgent: "Requires immediate attention",
    high: "Should be seen soon",
    medium: "Schedule at earliest convenience",
    low: "Routine consultation",
  };
  return descriptions[priority] || "Routine consultation";
}
