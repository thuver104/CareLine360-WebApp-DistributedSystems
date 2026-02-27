import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRole } from "../auth/authStorage";
import TriageForm from "../components/appointments/TriageForm";
import BookingForm from "../components/appointments/BookingForm";

export default function BookAppointment() {
  const role = getRole();
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState("");
  const [priority, setPriority] = useState("low");

  if (role !== "patient") {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364l-1.414 1.414M21 12h-2m-7-7V3m-4.364 1.636L6.222 6.05M3 12H1m3.636 4.364l1.414-1.414M12 21v-2" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Booking Restricted</h2>
        <p className="text-gray-500">Only patients can book appointments.</p>
      </div>
    );
  }

  const handleTriageAssess = (s, p) => {
    setSymptoms(s);
    setPriority(p);
  };

  const handleBooked = (appointment) => {
    navigate(`/appointments/${appointment._id}/payment`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Book an Appointment</h1>
      <p className="text-sm text-gray-400 mb-6">Describe your symptoms and schedule a consultation.</p>
      <div className="max-w-2xl">
        <TriageForm onAssess={handleTriageAssess} />
        <BookingForm symptoms={symptoms} priority={priority} onBooked={handleBooked} />
      </div>
    </div>
  );
}
