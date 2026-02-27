import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getRole } from "../auth/authStorage";
import TriageForm from "../components/appointments/TriageForm";
import BookingForm from "../components/appointments/BookingForm";

export default function BookAppointment() {
  const role = getRole();
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState("");
  const [priority, setPriority] = useState("low");
  const [triageDone, setTriageDone] = useState(false);

  if (role !== "patient") {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">Booking Restricted</h2>
        <p className="text-xs text-gray-400">Only patients can book appointments.</p>
      </div>
    );
  }

  const handleTriageAssess = (s, p) => {
    setSymptoms(s);
    setPriority(p);
    setTriageDone(true);
  };

  const handleBooked = (appointment) => {
    navigate(`/appointments/${appointment._id}/payment`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        to="/appointments"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 font-medium mb-4 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Appointments
      </Link>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 rounded-2xl p-6 mb-6 shadow-lg shadow-blue-500/15 overflow-hidden">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-white/10 rounded-full" />
        <div className="absolute -left-6 -bottom-12 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Book an Appointment</h1>
              <p className="text-white/60 text-xs">Describe your symptoms and schedule a consultation</p>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                !triageDone ? "bg-white text-blue-600" : "bg-white/30 text-white"
              }`}>
                1
              </span>
              <span className="text-xs text-white/80 font-medium">Symptoms</span>
            </div>
            <div className="w-8 h-px bg-white/20" />
            <div className="flex items-center gap-1.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                triageDone ? "bg-white text-blue-600" : "bg-white/20 text-white/50"
              }`}>
                2
              </span>
              <span className={`text-xs font-medium ${triageDone ? "text-white/80" : "text-white/40"}`}>Schedule</span>
            </div>
            <div className="w-8 h-px bg-white/20" />
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white/50">
                3
              </span>
              <span className="text-xs text-white/40 font-medium">Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forms */}
      <TriageForm onAssess={handleTriageAssess} />
      <BookingForm symptoms={symptoms} priority={priority} onBooked={handleBooked} />
    </div>
  );
}
