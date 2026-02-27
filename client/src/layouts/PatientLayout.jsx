import { Outlet } from "react-router-dom";
import PatientHeader from "../components/layout/PatientHeader";

/**
 * PatientLayout
 * Wraps all patient-facing pages with the shared sticky header.
 * Pages render via <Outlet /> below the header.
 * Supports light/dark mode via html.dark class (ThemeContext).
 */
export default function PatientLayout() {
  return (
    <div className="min-h-screen bg-[#f6fbff] dark:bg-slate-950 transition-colors duration-300">
      <PatientHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
