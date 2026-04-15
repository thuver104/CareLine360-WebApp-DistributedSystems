import { useState } from "react";
import { MessageSquare } from "lucide-react";
import ChatWidget from "./ChatWidget";

/**
 * Floating Action Button that opens the chat widget.
 * Only renders when appointmentId is provided and status is confirmed.
 */
export default function ChatFab({ appointmentId, status, doctorName }) {
  const [open, setOpen] = useState(false);

  // Only show for confirmed appointments
  if (!appointmentId || status !== "confirmed") return null;

  if (open) {
    return (
      <ChatWidget
        appointmentId={appointmentId}
        doctorName={doctorName}
        onClose={() => setOpen(false)}
      />
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-gradient-to-br from-[#0d9488] to-[#0891b2] text-white rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
    >
      <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />

      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-2xl bg-[#0d9488] animate-ping opacity-20 pointer-events-none" />
    </button>
  );
}
