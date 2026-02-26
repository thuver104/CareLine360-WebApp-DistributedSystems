import { useState } from "react";
import DoctorHeader from "./DoctorHeader";

/**
 * DashboardLayout – Doctor portal
 * Replaces the old sidebar+topbar pattern with a single sticky header.
 * Supports light/dark mode via html.dark class (ThemeContext).
 */
export default function DashboardLayout({ children }) {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <DoctorHeader active={activePage} setActive={setActivePage} />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {children}
      </main>
    </div>
  );
}
