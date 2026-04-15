import { Outlet, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getRole } from "../auth/authStorage";
import PatientNavbar from "../pages/patient/components/PatientNavbar";

export default function AppointmentLayout() {
  const role = getRole();

  if (role === "patient") {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] p-6">
        <PatientNavbar />
        <div className="max-w-6xl mx-auto px-5 py-6">
          <Outlet />
        </div>
      </div>
    );
  }

  // Doctor (or other roles) get a minimal nav
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="sticky top-0 z-10 bg-[var(--topbar-bg)] border-b border-[var(--glass-border)]">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/doctor/dashboard" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#0d9488] dark:hover:text-teal-400 transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Appointments</span>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-5 py-6">
        <Outlet />
      </div>
    </div>
  );
}
