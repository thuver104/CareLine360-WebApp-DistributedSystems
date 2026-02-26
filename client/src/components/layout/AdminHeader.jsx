import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  AlertCircle,
  Users,
  Video,
  BarChart3,
  Shield,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { getFullName, clearAuth } from "../../auth/authStorage";
import { useTheme } from "../../context/ThemeContext";

const ADMIN_NAV = [
  { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
  { path: "/admin/dashboard/emergencies", icon: AlertCircle, label: "Emergencies", end: false },
  { path: "/admin/dashboard/users", icon: Users, label: "Users", end: false },
  { path: "/admin/dashboard/meet-assign", icon: Video, label: "Meet Assign", end: false },
  { path: "/admin/dashboard/analytics", icon: BarChart3, label: "Analytics", end: false },
];

const RESPONDER_NAV = [
  { path: "/admin/dashboard/emergencies", icon: AlertCircle, label: "Emergencies", end: false },
];

export default function AdminHeader() {
  const navigate = useNavigate();
  const fullName = getFullName();
  const role = localStorage.getItem("role");
  const { isDark, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = role === "responder" ? RESPONDER_NAV : ADMIN_NAV;

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <header className="cl-admin-header sticky top-0 z-50">
      <div className="cl-header-inner">

        {/* ── Brand ── */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/30">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <span className="font-black text-[var(--text-primary)] text-base leading-tight tracking-tight">
              CareLine<span className="text-teal-500">360</span>
            </span>
            <span className="ml-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              {role === "responder" ? "Responder" : "Admin Portal"}
            </span>
          </div>
        </div>

        {/* ── Desktop Nav ── */}
        <nav className="hidden lg:flex items-center gap-1">
          {menuItems.map(({ path, icon: Icon, label, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-tight transition-all duration-300 ${isActive
                  ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-[inset_0_0_0_1px_rgba(20,184,166,0.2)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">
          {/* User pill */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)]">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm">
              {fullName ? fullName.charAt(0).toUpperCase() : "A"}
            </div>
            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider max-w-[120px] truncate">
              {fullName || "Admin"}
            </span>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] hover:bg-[var(--bg-muted)] flex items-center justify-center transition-all duration-300 active:scale-95"
            aria-label="Toggle dark mode"
          >
            {isDark
              ? <Sun size={16} className="text-amber-400 animate-in spin-in-180 duration-500" />
              : <Moon size={16} className="text-indigo-600 animate-in spin-in-180 duration-500" />
            }
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            {mobileOpen ? <X size={18} className="text-gray-700 dark:text-gray-300" /> : <Menu size={18} className="text-gray-700 dark:text-gray-300" />}
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
              {menuItems.map(({ path, icon: Icon, label, end }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                      ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8"
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}

              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/10 flex flex-col gap-1">
                <button
                  onClick={() => { toggleTheme(); setMobileOpen(false); }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                >
                  {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
