import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getRole } from "../auth/authStorage";
import { getUsers } from "../api/userApi";
import { createAppointment } from "../api/appointmentApi";
import { useToast } from "../context/ToastContext";
import BookingStepper from "../components/appointments/BookingStepper";
import TriageForm from "../components/appointments/TriageForm";
import DoctorSelectStep from "../components/appointments/DoctorSelectStep";
import TimeSlotStep from "../components/appointments/TimeSlotStep";
import ConfirmStep from "../components/appointments/ConfirmStep";

const STEPS = ["Triage", "Doctor", "Schedule", "Confirm"];

export default function BookAppointment() {
  const role = getRole();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [symptoms, setSymptoms] = useState("");
  const [priority, setPriority] = useState("low");
  const [doctorId, setDoctorId] = useState("");
  const [doctorObj, setDoctorObj] = useState(null);
  const [schedule, setSchedule] = useState({ date: "", time: "", consultationType: "video", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    getUsers("doctor")
      .then((res) => setDoctors(res.data.data))
      .catch(() => {});
  }, []);

  if (role !== "patient") {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364l-1.414 1.414M21 12h-2m-7-7V3m-4.364 1.636L6.222 6.05M3 12H1m3.636 4.364l1.414-1.414M12 21v-2" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Booking Restricted</h2>
        <p className="text-gray-500 dark:text-gray-400">Only patients can book appointments.</p>
      </div>
    );
  }

  const handleTriageAssess = (s, p) => {
    setSymptoms(s);
    setPriority(p);
    setStep(1);
  };

  const handleDoctorSelect = (id) => {
    setDoctorId(id);
    const doc = doctors.find((d) => d._id === id);
    setDoctorObj(doc);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const data = {
        doctor: doctorId,
        date: schedule.date,
        time: schedule.time,
        consultationType: schedule.consultationType,
        symptoms: symptoms || "",
        notes: schedule.notes || "",
        priority: priority || "low",
      };
      const res = await createAppointment(data);
      toast.success("Appointment booked successfully!");
      navigate(`/appointments/${res.data.data._id}/payment`);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to book appointment";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedFromSchedule = schedule.date && schedule.time;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Book an Appointment</h1>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">Follow the steps to schedule your consultation.</p>

      <BookingStepper currentStep={step} steps={STEPS} />

      <div className="max-w-2xl mx-auto">
        {/* Step 0: Triage */}
        {step === 0 && (
          <TriageForm onAssess={handleTriageAssess} />
        )}

        {/* Step 1: Doctor Selection */}
        {step === 1 && (
          <>
            <DoctorSelectStep selected={doctorId} onSelect={handleDoctorSelect} />
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!doctorId}
                className="px-6 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 2: Date/Time Selection */}
        {step === 2 && (
          <>
            <TimeSlotStep
              date={schedule.date}
              time={schedule.time}
              consultationType={schedule.consultationType}
              notes={schedule.notes}
              onChange={setSchedule}
            />
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedFromSchedule}
                className="px-6 py-2 bg-[#0d9488] text-white text-sm font-medium rounded-xl hover:bg-[#0b7c72] active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
              >
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <>
            <ConfirmStep
              doctor={doctorObj}
              date={schedule.date}
              time={schedule.time}
              consultationType={schedule.consultationType}
              symptoms={symptoms}
              priority={priority}
              notes={schedule.notes}
              onEdit={setStep}
              onConfirm={handleConfirm}
              submitting={submitting}
            />
            <div className="mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
