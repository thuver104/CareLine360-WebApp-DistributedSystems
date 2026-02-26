import { useState } from "react";
import { api } from "../api/axios";

export default function EmergencySOSFloating() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (e) => reject(e),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });

  const onSOS = async () => {
    setErr("");
    setToast("");

    const ok = window.confirm("Send SOS with your current location?");
    if (!ok) return;

    try {
      setLoading(true);

      const pos = await getCurrentPosition();
      const latitude = pos.coords.latitude;
      const longitude = pos.coords.longitude;

      await api.post("/emergencies", {
        description: "SOS emergency triggered from patient app",
        latitude,
        longitude,
      });

      setToast("SOS sent. Help is being notified.");
      setTimeout(() => setToast(""), 3500);
    } catch (e) {
      const code = e?.code;
      if (code === 1) setErr("Location permission denied. Please allow location.");
      else if (code === 2) setErr("Location unavailable. Turn on GPS.");
      else if (code === 3) setErr("Location timed out. Try again.");
      else setErr(e?.response?.data?.message || e?.message || "Failed to send SOS.");
      setTimeout(() => setErr(""), 4500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onSOS}
          disabled={loading}
          className="relative flex items-center gap-3 rounded-full bg-red-600 text-white px-5 py-4 shadow-2xl hover:bg-red-700 active:scale-[0.98] transition disabled:opacity-60"
        >
          {/* Pulse ring */}
          <span className="absolute -inset-1 rounded-full bg-red-600/30 animate-ping" />

          {/* Icon */}
          <span className="relative text-lg">🚨</span>

          {/* Text */}
          <span className="relative font-semibold text-sm">
            {loading ? "Sending..." : "SOS"}
          </span>
        </button>

        {/* Small helper text */}
        <div className="mt-2 text-[11px] text-gray-600 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow border">
          Tap to share location
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 bg-black text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Error toast */}
      {err && (
        <div className="fixed bottom-24 right-6 z-50 bg-red-700 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          {err}
        </div>
      )}
    </>
  );
}