import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  BarChart3,
  ClipboardList,
  Settings,
  HelpCircle,
  ChevronsRight,
  Stethoscope,
  Wifi,
} from "lucide-react";
import { DOCTOR_INFO } from "../../utils/dashboardData";

const NAV_MAIN = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Calendar,        label: "Appointments", badge: 5 },
  { icon: ClipboardList,   label: "Availability" },
  { icon: FileText,        label: "Medical Records" },
  { icon: Users,           label: "My Patients" },
  { icon: BarChart3,       label: "Analytics" },
];

const NAV_ACCOUNT = [
  { icon: Settings,   label: "Settings" },
  { icon: HelpCircle, label: "Help & Support" },
];

export default function Sidebar({ active, setActive }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    /* cl-sidebar handles all the glassmorphism + flex-col + height */
    <aside
      className="cl-sidebar"
      style={{ width: collapsed ? "70px" : "256px" }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3 px-3 pt-5 pb-4 border-b border-gray-200 dark:border-white/20 flex-shrink-0">
        <div className="grid h-10 w-10 shrink-0 place-content-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 shadow-lg shadow-teal-500/30">
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
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 pt-3 space-y-0.5 overflow-y-auto scrollbar-none">
        {NAV_MAIN.map(({ icon: Icon, label, badge }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(label)}
              title={collapsed ? label : ""}
              className={`
                relative flex items-center w-full rounded-xl h-11
                transition-all duration-200 cursor-pointer
                ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
                ${isActive
                  ? "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              {/* Active bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-500 rounded-r-full" />
              )}

              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-teal-500" : ""}`} />

              {!collapsed && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}

              {/* Badge */}
              {badge && !collapsed && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-500 px-1.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
              {badge && collapsed && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-500" />
              )}
            </button>
          );
        })}

        {/* Account section */}
        {!collapsed && (
          <p className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-400">
            Account
          </p>
        )}
        {collapsed && <div className="my-3 border-t border-gray-200 dark:border-white/15" />}

        {NAV_ACCOUNT.map(({ icon: Icon, label }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(label)}
              title={collapsed ? label : ""}
              className={`
                relative flex items-center w-full rounded-xl h-11
                transition-all duration-200 cursor-pointer
                ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
                ${isActive
                  ? "bg-teal-500/15 text-teal-600 dark:text-teal-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white"
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-500 rounded-r-full" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Doctor Profile Card ── */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-2xl glass-card-teal flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-white/30">
              {DOCTOR_INFO.initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {DOCTOR_INFO.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-teal-200 truncate">
                {DOCTOR_INFO.specialty}
              </p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-teal-500/20 p-1">
              <Wifi className="h-3 w-3 text-teal-500" />
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-gray-500 dark:text-teal-200">Available – Online</span>
          </div>
        </div>
      )}

      {/* ── Collapse Toggle ── */}
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