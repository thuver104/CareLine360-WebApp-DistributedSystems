import { Bell, Search, Moon, Sun, ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { DOCTOR_INFO } from "../../utils/dashboardData";

export default function Topbar({ pageTitle }) {
  const { isDark, toggleTheme } = useTheme();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    /* cl-topbar handles glass bg + border + blur */
    <header className="cl-topbar flex items-center justify-between px-6 py-4">

      {/* Left: title + date */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
          {pageTitle}
        </h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{today}</p>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2.5">

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl glass-input cursor-pointer hover:ring-1 hover:ring-teal-400/40 transition-all">
          <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-400">Search patients…</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl glass-btn text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl glass-btn text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark
            ? <Sun className="h-[18px] w-[18px]" />
            : <Moon className="h-[18px] w-[18px]" />
          }
        </button>

        {/* Avatar / profile */}
        <button className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl glass-btn transition-colors">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-teal-400/30 shrink-0">
            {DOCTOR_INFO.initials}
          </div>
          <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-200">
            {DOCTOR_INFO.name}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>
    </header>
  );
}