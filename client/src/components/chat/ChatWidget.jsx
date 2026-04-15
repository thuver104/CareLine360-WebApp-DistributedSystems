import { useState, useEffect, useCallback } from "react";
import { MessageSquare, X, Minimize2, ChevronDown } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { getMessages, markAsRead } from "../../api/chatApi";
import useSocket from "../../hooks/useSocket";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import { displayName } from "../../utils/displayName";

export default function ChatWidget({ appointmentId, doctorName, onClose }) {
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unread, setUnread] = useState(0);
  const socket = useSocket();
  const myUserId = localStorage.getItem("userId");

  // Join room and fetch messages
  useEffect(() => {
    if (!appointmentId) return;
    socket.emit("join_room", { appointmentId });

    getMessages(appointmentId)
      .then((res) => {
        setMessages(res.data.messages || res.data.data || []);
      })
      .catch((err) => console.error("Failed to fetch messages:", err));

    return () => {
      socket.emit("leave_room", { appointmentId });
    };
  }, [appointmentId, currentUser, socket]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      if (isMinimized) {
        setUnread((n) => n + 1);
      } else if (currentUser) {
        markAsRead(appointmentId, currentUser._id).catch(() => {});
      }
    };

    socket.on("new_message", handleNewMessage);
    return () => socket.off("new_message", handleNewMessage);
  }, [appointmentId, currentUser, socket, isMinimized]);

  const handleSend = (text) => {
    if (!currentUser) return;
    socket.emit("send_message", {
      appointmentId,
      message: text,
    });
  };

  const handleExpand = () => {
    setIsMinimized(false);
    setUnread(0);
    if (currentUser) {
      markAsRead(appointmentId, currentUser._id).catch(() => {});
    }
  };

  // Minimized state — just header bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[60]">
        <button
          onClick={handleExpand}
          className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-gradient-to-r from-[#0d9488] to-[#0891b2] text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">Chat{doctorName ? ` — Dr. ${doctorName}` : ""}</span>
          {unread > 0 && (
            <span className="ml-1 w-5 h-5 bg-white text-[#0d9488] text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
          <ChevronDown className="w-4 h-4 opacity-60 rotate-180" />
        </button>
      </div>
    );
  }

  // Expanded chat widget
  return (
    <div className="fixed bottom-6 right-6 z-[60] w-[380px] max-w-[calc(100vw-48px)]">
      <div className="flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-white/10" style={{ height: "480px" }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d9488] to-[#0891b2] px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Consultation Chat</p>
              {doctorName && (
                <p className="text-[10px] text-white/70">with Dr. {doctorName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Online indicator */}
        <div className="px-4 py-1.5 bg-white dark:bg-[var(--glass-bg)] border-b border-gray-100 dark:border-white/5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-gray-400 dark:text-gray-500">Online — messages are end-to-end</span>
        </div>

        {/* Messages */}
        <ChatWindow messages={messages} currentUserId={myUserId} />

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={!currentUser} />
      </div>
    </div>
  );
}
