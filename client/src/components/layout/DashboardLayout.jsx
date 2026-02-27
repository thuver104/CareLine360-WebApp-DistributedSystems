import { useState } from "react";
import DoctorHeader from "./DoctorHeader";

/**
 * DashboardLayout – Doctor portal
 * Replaces the old sidebar+topbar pattern with a single sticky header.
 * Supports light/dark mode via html.dark class (ThemeContext).
 */
export default function DashboardLayout({ children }) {
  const [section, setSection] = useState("Dashboard");
  const [doctor, setDoctor] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  // Search overlay + quick action are shared between Topbar/Sidebar and the page child
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAction, setQuickAction] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Keep section state in sync with URL
  useEffect(() => {
    if (location.pathname === "/doctor/profile") {
      setSection("profile");
    } else if (
      location.pathname === "/doctor/dashboard" &&
      section === "profile"
    ) {
      setSection("Dashboard");
    }
  }, [location.pathname]);

  useEffect(() => {
    getDoctorProfile()
      .then((r) => setDoctor(r.data.doctor))
      .catch((err) => {
        if (err?.response?.status === 404 || err?.response?.status === 403)
          navigate("/doctor/setup");
      })
      .finally(() => setProfileLoading(false));

    getDoctorDashboard()
      .then((r) => setPendingCount(r.data.stats?.pendingAppointments ?? 0))
      .catch(() => {});
  }, [navigate]);

  const refreshProfile = () => {
    getDoctorProfile()
      .then((r) => setDoctor(r.data.doctor))
      .catch(() => {});
  };

  // Sidebar quick-action handler — switch to Appointments + tell page which modal to open
  const handleQuickAction = (actionId) => {
    setSection("Appointments");
    setQuickAction(actionId);
  };

  // Inject searchOpen / quickAction props into the direct child page component
  const pageChild = isValidElement(children)
    ? cloneElement(children, {
        searchOpen,
        onSearchClose: () => setSearchOpen(false),
        quickAction,
        onQuickActionHandled: () => setQuickAction(null),
      })
    : children;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <DoctorHeader active={activePage} setActive={setActivePage} />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {children}
      </main>
    </div>
  );
}
