import { useState, useRef, useEffect } from "react";
import {
  Search,
  Moon,
  Sun,
  ChevronDown,
  UserCircle,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { getInitials } from "../../utils/colors";
import { clearAuth } from "../../auth/authStorage";
import { disconnectSocket } from "../../socket/socketClient";

const SECTION_LABELS = {
  Dashboard: "Dashboard",
  Appointments: "Appointments",
  "My Patients": "My Patients",
  Availability: "Availability",
  Analytics: "Analytics",
};

/**
 * Topbar
 *
 * Props:
 *   section  – active section id from DashboardLayout
 *   doctor   – { fullName, specialization, avatarUrl } from API
 */
export default function Topbar({ section, doctor, onSearchOpen }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const initials = getInitials(doctor?.fullName || "D");
  const displayName = doctor?.fullName ? `Dr. ${doctor.fullName}` : "Doctor";
  const pageTitle = SECTION_LABELS[section] || section;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearAuth();
    disconnectSocket();
    navigate("/");
  };

  return (
    <header className="cl-topbar flex items-center justify-between px-6 py-4">
      {/* Left: page title + date */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
          {pageTitle}
        </h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {today}
        </p>
      </div>

      {/* Right: search + theme toggle + profile dropdown */}
      <div className="flex items-center gap-2.5">
        {/* Search — clicking opens the patient search overlay */}
        <button
          onClick={onSearchOpen}
          className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl glass-input cursor-pointer hover:ring-1 hover:ring-teal-400/40 transition-all"
        >
          <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-400">Search patients...</span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl glass-btn text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative flex items-center gap-1" ref={dropRef}>
          {/* Avatar/Name — click navigates directly to profile */}
          <button
            id="topbar-profile-btn"
            onClick={() => navigate("/doctor/profile")}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl glass-btn transition-colors hover:ring-1 hover:ring-teal-400/40"
            title="My Profile"
          >
            {doctor?.avatarUrl ? (
              <img
                src={doctor.avatarUrl}
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-teal-400/30 shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-teal-400/30 shrink-0">
                {initials}
              </div>
            )}
            <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200">
              {displayName}
            </span>
          </button>

          {/* Chevron — opens dropdown (logout + profile link) */}
          <button
            id="topbar-profile-chevron"
            onClick={() => setDropOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={dropOpen}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Account menu"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown menu */}
          {dropOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-2xl glass-card overflow-hidden z-50 shadow-lg
                border border-gray-100 dark:border-white/10 animate-fade-in py-1"
            >
              {/* Profile Settings */}
              <button
                id="topbar-profile-settings"
                onClick={() => {
                  setDropOpen(false);
                  navigate("/doctor/profile");
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200
                  hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                <UserCircle className="h-4 w-4 shrink-0" />
                Profile Settings
              </button>

              <div className="border-t border-gray-100 dark:border-white/10 my-1" />

              {/* Logout */}
              <button
                id="topbar-logout"
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-600 dark:text-rose-400
                  hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
