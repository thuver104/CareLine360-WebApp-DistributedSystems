import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  BarChart3,
  Video,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { clearAuth, getRole } from "../../auth/authStorage";

const NAV_ITEMS = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/admin/dashboard",
    roles: ["admin"],
  },
  {
    icon: Users,
    label: "Manage Users",
    path: "/admin/dashboard/users",
    roles: ["admin"],
  },
  {
    icon: AlertTriangle,
    label: "Emergencies",
    path: "/admin/dashboard/emergencies",
    roles: ["admin", "responder"],
  },
  {
    icon: Video,
    label: "Meet Assign",
    path: "/admin/dashboard/meet-assign",
    roles: ["admin"],
  },
  {
    icon: BarChart3,
    label: "Analytics",
    path: "/admin/dashboard/analytics",
    roles: ["admin"],
  },
];

export default function AdminSidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = getRole() || "admin";

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole),
  );

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/admin/dashboard") {
      return location.pathname === "/admin/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 z-40"
      style={{ width: collapsed ? "72px" : "256px" }}
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="grid h-10 w-10 shrink-0 place-content-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              CareLine
              <span className="text-teal-500 dark:text-teal-400">360</span>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">
              {userRole === "responder" ? "Responder Portal" : "Admin Portal"}
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 pt-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ icon: Icon, label, path }) => {
          const active = isActive(path);
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-teal-600/20 text-teal-600 dark:text-teal-400 border border-teal-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-transparent"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 shrink-0 ${active ? "text-teal-600 dark:text-teal-400" : ""}`}
                style={{ height: "18px", width: "18px" }}
              />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Logout ── */}
      <div className="px-2 pb-4 border-t border-slate-200 dark:border-slate-800 pt-3 flex-shrink-0">
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <LogOut
            style={{ height: "18px", width: "18px" }}
            className="shrink-0"
          />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[72px] h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
