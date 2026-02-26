import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { connectSocket, disconnectSocket } from "./socket/socketClient";
import { hasToken } from "./auth/authStorage";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LandingPage from "./pages/LandingPage";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import Profile from "./pages/patient/Profile";
import Documents from "./pages/patient/Documents";
import PatientNavbar from "./pages/patient/PatientNavbar";

// Doctor Pages
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/doctor/DashboardPage";
import DoctorProfileSetup from "./pages/doctor/DoctorProfileSetup";
import DoctorProfilePage from "./pages/doctor/Doctorprofilepage";

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
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Patient */}
          <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/profile" element={<Profile />} />
            <Route path="/patient/documents" element={<Documents />} />
            <Route path="/patient/PatientNavbar" element={<PatientNavbar />} />
          </Route>

          {/* Doctor */}
          <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
            {/* Profile setup - NO sidebar layout */}
            <Route path="/doctor/setup" element={<DoctorProfileSetup />} />

            {/* Dashboard - WITH sidebar layout */}
            <Route
              path="/doctor/dashboard"
              element={
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              }
            />

            {/* Profile page - WITH sidebar layout */}
            <Route
              path="/doctor/profile"
              element={
                <DashboardLayout>
                  <DoctorProfilePage />
                </DashboardLayout>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}