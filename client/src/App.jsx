import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { connectSocket, disconnectSocket } from "./socket/socketClient";
import { hasToken } from "./auth/authStorage";

// Layouts
import MainLayout from "./layouts/MainLayout";
import PatientLayout from "./layouts/PatientLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import AppointmentLayout from "./layouts/AppointmentLayout";

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
import PatientNavbar from "./pages/patient/components/PatientNavbar";
import AiChat from "./pages/patient/AiChat";
import PatientMedicalHistory from "./pages/patient/PatientMedicalHistory";
import Directory from "./pages/patient/Directory";

// Doctor Pages
import DashboardPage from "./pages/doctor/DashboardPage";
import DoctorProfileSetup from "./pages/doctor/DoctorProfileSetup";
import DoctorProfilePage from "./pages/doctor/Doctorprofilepage";

// Admin Pages
import Dashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import EmergencyMonitoring from "./pages/admin/EmergencyMonitoring";
import Analytics from "./pages/admin/Analytics";
import MeetAssign from "./pages/admin/MeetAssign";

// Appointment Pages
import BookAppointment from "./pages/BookAppointment";
import ViewAppointments from "./pages/ViewAppointments";
import AppointmentDetail from "./pages/AppointmentDetail";
import ChatPage from "./pages/ChatPage";
import PaymentPage from "./pages/PaymentPage";
import AppointmentHistory from "./pages/AppointmentHistory";

// Route Protection
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  useEffect(() => {
    if (hasToken()) connectSocket();

    const onStorage = (e) => {
      if (e.key === "accessToken") {
        if (!e.newValue) disconnectSocket();
        else connectSocket();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <ThemeProvider>
      <Routes>
        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================= PATIENT ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
          <Route element={<PatientLayout />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/profile" element={<Profile />} />
            <Route path="/patient/documents" element={<Documents />} />
            <Route path="/patient/navbar" element={<PatientNavbar />} />
            <Route path="/patient/messages" element={<AiChat />} />
            <Route path="/patient/medical-history" element={<PatientMedicalHistory />} />
            <Route path="/patient/directory" element={<Directory />} />
          </Route>
        </Route>

        {/* ================= DOCTOR ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
          {/* Profile setup — no sidebar */}
          <Route path="/doctor/setup" element={<DoctorProfileSetup />} />

          {/* Dashboard with sidebar */}
          <Route
            path="/doctor/dashboard"
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            }
          />

          {/* Profile with sidebar */}
          <Route
            path="/doctor/profile"
            element={
              <DashboardLayout>
                <DoctorProfilePage />
              </DashboardLayout>
            }
          />
        </Route>

        {/* ================= ADMIN ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="meet-assign" element={<MeetAssign />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Route>

        {/* ================= EMERGENCY ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "responder"]} />}>
          <Route path="/admin/dashboard/emergencies" element={<MainLayout />}>
            <Route index element={<EmergencyMonitoring />} />
          </Route>
        </Route>

        {/* ================= APPOINTMENT ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["patient", "doctor"]} />}>
          <Route element={<AppointmentLayout />}>
            <Route path="/appointments/book" element={<BookAppointment />} />
            <Route path="/appointments/history" element={<AppointmentHistory />} />
            <Route path="/appointments/:id/payment" element={<PaymentPage />} />
            <Route path="/appointments/:id/chat" element={<ChatPage />} />
            <Route path="/appointments/:id" element={<AppointmentDetail />} />
            <Route path="/appointments" element={<ViewAppointments />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  );
}