export { default } from './DashboardLayoutAdmin.jsx';
import {
  useState,
  useEffect,
  createContext,
  useContext,
  cloneElement,
  isValidElement,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastContainer } from "../ui/Toast";
import AIChatWidget from "../dashboard/AIChatWidget";
import { getDoctorProfile, getDoctorDashboard } from "../../api/doctorApi";

// ── Doctor context — any child can read doctor data + current section ─────────
const DoctorContext = createContext(null);
export const useDoctorContext = () => useContext(DoctorContext);

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
    <DoctorContext.Provider
      value={{ doctor, profileLoading, refreshProfile, section, setSection }}
    >
      {/* Global toast container — renders above everything */}
      <ToastContainer />

      <div className="cl-page">
        <Sidebar
          section={section}
          setSection={setSection}
          doctor={doctor}
          pendingCount={pendingCount}
          onQuickAction={handleQuickAction}
        />

        <div className="cl-right-col">
          <Topbar
            section={section}
            doctor={doctor}
            onSearchOpen={() => setSearchOpen(true)}
          />

          <main className="cl-main p-6">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              {pageChild}
            </div>
          </main>
        </div>
      </div>

      {/* Floating AI chatbot — doctor portal only */}
      <AIChatWidget />
    </DoctorContext.Provider>
  );
}
