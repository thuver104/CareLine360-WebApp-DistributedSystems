import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  BarChart3,
  ClipboardList,
  Settings,
  HelpCircle,
  Stethoscope,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Wifi,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { DOCTOR_INFO } from "../../utils/dashboardData";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Calendar,        label: "Appointments", badge: 5 },
  { icon: ClipboardList,   label: "Availability" },
  { icon: FileText,        label: "Medical Records" },
  { icon: Users,           label: "My Patients" },
  { icon: BarChart3,       label: "Analytics" },
  { icon: Settings,        label: "Settings" },
  { icon: HelpCircle,      label: "Help & Support" },
];

export default function DoctorHeader({ active, setActive }) {
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="cl-admin-header sticky top-0 z-50">
      <div className="cl-header-inner">

        {/* ── Brand ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/30">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-base leading-tight">
              CareLine<span className="text-teal-500">360</span>
            </span>
            <span className="ml-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Doctor Portal
            </span>
          </div>
        </div>

        {/* ── Desktop Nav ── */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, badge }) => {
            const isActive = active === label;
            return (
              <button
                key={label}
                onClick={() => setActive(label)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon size={15} />
                {label}
                {badge && (
                  <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-teal-500 px-1 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">
          {/* Date */}
          <span className="hidden xl:block text-xs text-gray-400 dark:text-gray-500 font-medium">
            {today}
          </span>

          {/* Notifications */}
          <button className="relative h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors">
            <Bell size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-900" />
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark
              ? <Sun size={16} className="text-amber-400" />
              : <Moon size={16} className="text-gray-600" />
            }
          </button>

          {/* Doctor avatar pill */}
          <div className="hidden sm:flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl bg-gray-100 dark:bg-white/8">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {DOCTOR_INFO.initials}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-gray-800 dark:text-white leading-tight">
                {DOCTOR_INFO.name}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-teal-300 leading-tight">
                {DOCTOR_INFO.specialty}
              </p>
            </div>
            <span className="ml-1 shrink-0 rounded-full bg-teal-500/20 p-0.5">
              <Wifi size={10} className="text-teal-500" />
            </span>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            {mobileOpen
              ? <X size={18} className="text-gray-700 dark:text-gray-300" />
              : <Menu size={18} className="text-gray-700 dark:text-gray-300" />
            }
          </button>
        </div>
      </div>

      {/* ── Mobile Nav Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="lg:hidden border-t border-gray-100 dark:border-white/10 bg-white dark:bg-slate-950 overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map(({ icon: Icon, label, badge }) => {
                const isActive = active === label;
                return (
                  <button
                    key={label}
                    onClick={() => { setActive(label); setMobileOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                    {badge && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-500 px-1.5 text-[10px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
