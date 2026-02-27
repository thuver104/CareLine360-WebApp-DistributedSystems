import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Menu, X, Stethoscope, LogOut, User, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../api/axios";

const NAV_ITEMS = [
  { label: "Overview",        href: "/patient/dashboard" },
  { label: "Documents",       href: "/patient/documents" },
  { label: "Medical History", href: "/patient/medical-history" },
  { label: "AI Chat",         href: "/patient/messages" },
];

export default function PatientHeader() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [me, setMe]                 = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    api.get("/patients/me")
      .then((r) => setMe(r.data))
      .catch(() => setMe(null));
  }, []);

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <header className="cl-header sticky top-0 z-50">
      <div className="cl-header-inner">

        {/* ── Brand ── */}
        <Link to="/patient/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md shadow-teal-500/30">
            <Stethoscope size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-base leading-tight">
            CareLine<span className="text-teal-500">360</span>
          </span>
        </Link>

        {/* ── Desktop Nav ── */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8"
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="patient-nav-pill"
                    className="absolute inset-0 rounded-xl bg-teal-50 dark:bg-teal-900/30 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <button className="relative h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors">
            <Bell size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950" />
          </button>

          {/* Avatar / profile link */}
          <Link
            to="/patient/profile"
            className="h-9 w-9 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-white/15 hover:border-teal-400 dark:hover:border-teal-500 transition-colors shadow-sm"
            title="My Profile"
          >
            {me?.avatarUrl ? (
              <img
                src={me.avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
            )}
          </Link>

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

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 dark:bg-white/10 dark:border dark:border-white/15 text-white text-sm font-medium hover:bg-gray-700 dark:hover:bg-white/20 transition-colors"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/8 hover:bg-gray-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors"
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
            className="md:hidden border-t border-gray-100 dark:border-white/10 bg-white dark:bg-slate-950 overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
