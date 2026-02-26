import { Outlet, Link } from "react-router-dom";
import { getRole } from "../auth/authStorage";
import PatientNavbar from "../pages/patient/components/PatientNavbar";

export default function AppointmentLayout() {
  const role = getRole();

  if (role === "patient") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6fbff] to-white p-6">
        <PatientNavbar />
        <div className="max-w-6xl mx-auto px-5 py-6">
          <Outlet />
        </div>
      </div>
    );
  }

  // Doctor (or other roles) get a minimal nav
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/doctor/dashboard" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <span className="text-sm font-semibold text-gray-900">Appointments</span>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-5 py-6">
        <Outlet />
      </div>
    </div>
  );
}
