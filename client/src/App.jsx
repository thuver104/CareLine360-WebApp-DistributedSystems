import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./components/layout/DashboardLayout";

// Landing
import LandingPage from "./pages/LandingPage";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import Profile from "./pages/patient/Profile";
import Documents from "./pages/patient/Documents";
import PatientNavbar from "./pages/patient/PatientNavbar";

// Doctor Pages
import DashboardPage from "./pages/doctor/DashboardPage";

// Admin / Monitoring Pages
import Dashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import EmergencyMonitoring from "./pages/admin/EmergencyMonitoring";
import Analytics from "./pages/admin/Analytics";
import MeetAssign from "./pages/admin/MeetAssign";


// Route Protection
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Patient Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/profile" element={<Profile />} />
            <Route path="/patient/documents" element={<Documents />} />
            <Route path="/patient/navbar" element={<PatientNavbar />} />
          </Route>

          {/* Doctor Dashboard */}
          <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
            <Route
              path="/doctor/dashboard"
              element={
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              }
            />
          </Route>

          {/* Admin / Monitoring Layout */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="meet-assign" element={<MeetAssign />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Route>

          {/* Emergencies tab for admin and responder */}
          <Route element={<ProtectedRoute allowedRoles={["admin", "responder"]} />}>
            <Route path="/admin/dashboard/emergencies" element={<MainLayout />}>
              <Route index element={<EmergencyMonitoring />} />
            </Route>
          </Route>

          {/* Emergencies tab for admin and responder */}
          <Route element={<ProtectedRoute allowedRoles={["admin", "responder"]} />}>
            <Route path="/admin/dashboard/emergencies" element={<MainLayout />}>
              <Route index element={<EmergencyMonitoring />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}