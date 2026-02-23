// ─── Mock data – replace with API calls when backend is ready ───

export const DOCTOR_INFO = {
  name: "Dr. Clerin",
  specialty: "General Physician",
  initials: "CL",
  verified: true,
  status: "available", // available | busy | offline
};

export const STATS = [
  {
    id: "appointments",
    label: "Today's Appointments",
    value: "12",
    change: "+3 from yesterday",
    trend: "up",
    colorKey: "teal",
  },
  {
    id: "pending",
    label: "Pending Requests",
    value: "5",
    change: "2 urgent",
    trend: "warn",
    colorKey: "amber",
  },
  {
    id: "records",
    label: "Records Created",
    value: "38",
    change: "+6 this week",
    trend: "up",
    colorKey: "blue",
  },
  {
    id: "rating",
    label: "Patient Rating",
    value: "4.8",
    change: "120 reviews",
    trend: "up",
    colorKey: "rose",
  },
];

export const APPOINTMENTS = [
  {
    id: "APT-001",
    patient: "Amara Silva",
    time: "09:00 AM",
    type: "Consultation",
    priority: "HIGH",
    status: "ACCEPTED",
  },
  {
    id: "APT-002",
    patient: "Kavindra Perera",
    time: "10:30 AM",
    type: "Follow-up",
    priority: "MEDIUM",
    status: "REQUESTED",
  },
  {
    id: "APT-003",
    patient: "Nisha Fernando",
    time: "11:15 AM",
    type: "Prescription",
    priority: "LOW",
    status: "ACCEPTED",
  },
  {
    id: "APT-004",
    patient: "Roshan Jayawardena",
    time: "02:00 PM",
    type: "Consultation",
    priority: "HIGH",
    status: "REQUESTED",
  },
  {
    id: "APT-005",
    patient: "Dilani Rathnayake",
    time: "03:30 PM",
    type: "Follow-up",
    priority: "MEDIUM",
    status: "COMPLETED",
  },
];

export const MEDICAL_RECORDS = [
  {
    id: "REC-001",
    patient: "Amara Silva",
    diagnosis: "Hypertension Stage 1",
    date: "Today, 09:45 AM",
    hasPrescription: true,
  },
  {
    id: "REC-002",
    patient: "Tharaka Wijesuriya",
    diagnosis: "Type 2 Diabetes – Routine Review",
    date: "Yesterday, 02:30 PM",
    hasPrescription: true,
  },
  {
    id: "REC-003",
    patient: "Malini Chandrasekara",
    diagnosis: "Acute Respiratory Infection",
    date: "18 Feb, 11:00 AM",
    hasPrescription: false,
  },
  {
    id: "REC-004",
    patient: "Saman Bandara",
    diagnosis: "Lumbar Disc Herniation",
    date: "17 Feb, 04:00 PM",
    hasPrescription: true,
  },
];

export const ACTIVITY_FEED = [
  {
    type: "completed",
    message: "Appointment APT-003 marked complete",
    time: "5 min ago",
    colorKey: "green",
  },
  {
    type: "prescription",
    message: "Prescription PDF generated for Amara Silva",
    time: "22 min ago",
    colorKey: "blue",
  },
  {
    type: "alert",
    message: "New HIGH-priority request from Roshan J.",
    time: "45 min ago",
    colorKey: "amber",
  },
  {
    type: "patient",
    message: "New patient Kavindra Perera registered",
    time: "1 hr ago",
    colorKey: "teal",
  },
  {
    type: "review",
    message: "New 5-star review from Dilani R.",
    time: "2 hrs ago",
    colorKey: "rose",
  },
];

export const SLOT_DATA = [
  { label: "Morning (6–12)", pct: 75, colorKey: "teal" },
  { label: "Afternoon (12–17)", pct: 58, colorKey: "blue" },
  { label: "Evening (17–20)", pct: 33, colorKey: "purple" },
];

export const ANALYTICS_DATA = [
  { label: "Completion Rate", value: "91%", pct: 91, colorKey: "teal" },
  { label: "Avg Response Time", value: "8 min", pct: 72, colorKey: "blue" },
  { label: "Patient Retention", value: "78%", pct: 78, colorKey: "purple" },
  { label: "Prescriptions Sent", value: "34", pct: 60, colorKey: "amber" },
];