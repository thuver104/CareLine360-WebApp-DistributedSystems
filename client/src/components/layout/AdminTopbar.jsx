import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Sun, Moon, ChevronDown, LogOut, User } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { clearAuth, getFullName } from "../../auth/authStorage";

const PAGE_TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/dashboard/users": "Manage Users",
  "/admin/dashboard/emergencies": "Emergency Monitoring",
  "/admin/dashboard/meet-assign": "Meet Assign",
  "/admin/dashboard/analytics": "Analytics",
};

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AD"
  );
}

export default function AdminTopbar() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);

  const fullName = getFullName() || "Admin";
  const initials = getInitials(fullName);
  const pageTitle = PAGE_TITLES[location.pathname] ?? "Admin";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
      {/* Left: title + date */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
          {pageTitle}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">{today}</p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun
              className="h-4.5 w-4.5"
              style={{ height: "18px", width: "18px" }}
            />
          ) : (
            <Moon
              className="h-4.5 w-4.5"
              style={{ height: "18px", width: "18px" }}
            />
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell style={{ height: "18px", width: "18px" }} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
              {fullName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {dropOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {fullName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
