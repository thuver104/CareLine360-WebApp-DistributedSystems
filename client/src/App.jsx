import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import BookAppointment from "./pages/BookAppointment";
import ViewAppointments from "./pages/ViewAppointments";
import AppointmentDetail from "./pages/AppointmentDetail";
import ChatPage from "./pages/ChatPage";
import PaymentPage from "./pages/PaymentPage";
import AppointmentHistory from "./pages/AppointmentHistory";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/appointments/book" replace />} />
        <Route path="/appointments/book" element={<BookAppointment />} />
        <Route path="/appointments/history" element={<AppointmentHistory />} />
        <Route path="/appointments/:id/payment" element={<PaymentPage />} />
        <Route path="/appointments/:id/chat" element={<ChatPage />} />
        <Route path="/appointments/:id" element={<AppointmentDetail />} />
        <Route path="/appointments" element={<ViewAppointments />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
