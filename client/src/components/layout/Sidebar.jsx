export { default } from './SidebarAdmin.jsx';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  CalendarClock,
  BarChart3,
  ChevronsRight,
  Stethoscope,
  LogOut,
  Video,
} from "lucide-react";
import { getInitials } from "../../utils/colors";
import { clearAuth } from "../../auth/authStorage";
import { disconnectSocket } from "../../socket/socketClient";

const NAV_MAIN = [
  { id: "Dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    id: "Appointments",
    icon: CalendarCheck,
    label: "Appointments",
    hasBadge: true,
  },
  { id: "My Patients", icon: Users, label: "My Patients" },
  { id: "Meetings", icon: Video, label: "Meetings" },
  { id: "Availability", icon: CalendarClock, label: "Availability" },
  { id: "Analytics", icon: BarChart3, label: "Analytics" },
];

export default function Sidebar({
  section,
  setSection,
  doctor,
  pendingCount = 0,
  onQuickAction,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    disconnectSocket();
    navigate("/");
  };

  const handleNavClick = (id) => {
    setSection(id);
  };

  const handleActionClick = (id) => {
    // Switch to Appointments view, then let parent know which action to highlight
    setSection("Appointments");
    onQuickAction?.(id);
  };

  const initials = getInitials(doctor?.fullName || "D");
  const displayName = doctor?.fullName ? `Dr. ${doctor.fullName}` : "Doctor";
  const specialty = doctor?.specialization || "—";

  return (
    <aside
      className="cl-sidebar"
      style={{ width: collapsed ? "70px" : "256px" }}
    >
      {/* ── Brand / Logo ─────────────────────────────────────────── */}
      <button
        className="flex items-center gap-3 px-3 pt-5 pb-4 border-b border-gray-200 dark:border-white/10
          w-full text-left hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
        onClick={() => {
          setSection("Dashboard");
          navigate("/doctor/dashboard");
        }}
        title="Go to Dashboard"
      >
        <div
          className="grid h-10 w-10 shrink-0 place-content-center rounded-xl
          bg-gradient-to-br from-teal-400 to-cyan-600 shadow-lg shadow-teal-500/30"
        >
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              CareLine<span className="text-teal-500">360</span>
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em]">
              Doctor Portal
            </p>
          </div>
        )}
      </button>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className="flex-1 px-2 pt-3 space-y-0.5 overflow-y-auto scrollbar-none">
        {/* Main nav */}
        {NAV_MAIN.map(({ id, icon: Icon, label, hasBadge }) => {
          const isActive = section === id;
          const showBadge = hasBadge && pendingCount > 0;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              title={collapsed ? label || id : ""}
              className={`
                relative flex items-center w-full rounded-xl h-11
                transition-all duration-200 cursor-pointer
                ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
                ${
                  isActive
                    ? "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-500 rounded-r-full" />
              )}
              <Icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-teal-500" : ""}`}
              />
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {label || id}
                </span>
              )}
              {showBadge && !collapsed && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-500 px-1.5 text-[10px] font-bold text-white">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
              {showBadge && collapsed && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-500" />
              )}
            </button>
          );
        })}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
          className={`
            relative flex items-center w-full rounded-xl h-11 mt-4
            transition-all duration-200 cursor-pointer
            text-gray-500 dark:text-gray-400
            hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400
            ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
          `}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </nav>

      {/* ── Doctor card (expanded) or avatar button (collapsed) ──────────────── */}
      {collapsed ? (
        <button
          className="mx-auto mb-3 h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/20 hover:opacity-90 transition-opacity flex-shrink-0"
          onClick={() => navigate("/doctor/profile")}
          title="My Profile"
        >
          {doctor?.avatarUrl ? (
            <img
              src={doctor.avatarUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </button>
      ) : (
        <div
          className="mx-3 mb-3 p-3 rounded-2xl glass-card-teal flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => navigate("/doctor/profile")}
          title="My Profile"
        >
          <div className="flex items-center gap-2.5">
            {doctor?.avatarUrl ? (
              <img
                src={doctor.avatarUrl}
                alt={displayName}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/30 shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white/30">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-teal-200 truncate">
                {specialty}
              </p>
            </div>
            <span className="ml-auto shrink-0">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-gray-500 dark:text-teal-200">
              Available – Online
            </span>
          </div>
        </div>
      )}

      {/* ── Collapse toggle ───────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`
          flex items-center gap-2 border-t border-gray-200 dark:border-white/15
          text-gray-400 hover:text-teal-500 transition-colors
          w-full flex-shrink-0 py-3
          ${collapsed ? "justify-center px-0" : "px-3"}
        `}
      >
        <div className="grid h-9 w-9 place-content-center shrink-0">
          <ChevronsRight
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`}
          />
        </div>
        {!collapsed && <span className="text-sm font-medium">Collapse</span>}
      </button>
    </aside>
  );
}
