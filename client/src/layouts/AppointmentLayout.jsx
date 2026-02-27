import { Outlet, Link } from "react-router-dom";
import { getRole } from "../auth/authStorage";
import PatientNavbar from "../pages/patient/components/PatientNavbar";

export default function AppointmentLayout() {
  const role = getRole();

  if (role === "patient") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f5ff] via-[#f8faff] to-white">
        <PatientNavbar />
        <div className="max-w-4xl mx-auto px-5 py-6">
          <Outlet />
        </div>
      </div>
    );
  }

  // Doctor (or other roles) get a minimal nav
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f5ff] via-[#f8faff] to-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-4xl mx-auto px-5 py-2.5 flex items-center justify-between">
          <Link to="/doctor/dashboard" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 font-medium transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <span className="text-xs font-bold text-gray-800 tracking-wide">Appointments</span>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-5 py-6">
        <Outlet />
      </div>
    </div>
  );
}
