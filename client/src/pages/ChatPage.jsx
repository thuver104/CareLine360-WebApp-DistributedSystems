import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useUser } from "../context/UserContext";
import { getMessages, markAsRead } from "../api/chatApi";
import { getAppointmentById } from "../api/appointmentApi";
import { displayName } from "../utils/displayName";
import { getInitials } from "../utils/colors";
import {
  getSocket,
  joinChatRoom,
  leaveChatRoom,
  sendChatMessage,
  emitTyping,
  emitStopTyping,
} from "../socket/socketClient";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";

export default function ChatPage() {
  const { id } = useParams();
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const [appointment, setAppointment] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserRole, setTypingUserRole] = useState(null);
  const [connected, setConnected] = useState(false);
  const [doctorName, setDoctorName] = useState("Doctor");
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const currentUserRole = localStorage.getItem("role") || currentUser?.role || "patient";

  // Fetch appointment to get other-party info and doctor name
  useEffect(() => {
    if (!id) return;
    getAppointmentById(id)
      .then((res) => {
        const apt = res.data.data;
        setAppointment(apt);
        // Prefer fullName from Doctor profile model, fallback to User model
        if (apt?.doctorProfile?.fullName) {
          setDoctorName(apt.doctorProfile.fullName);
        } else if (apt?.doctor) {
          setDoctorName(displayName(apt.doctor));
        }
      })
      .catch((err) => console.warn("Failed to fetch appointment:", err));
  }, [id]);

  // Initialize socket connection and set up listeners
  useEffect(() => {
    console.log("ChatPage: Initializing socket listeners");
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket) {
      console.error("❌ ChatPage: Socket not initialized");
      return;
    }

    console.log(
      "✅ ChatPage: Socket instance available, connected=",
      socket.connected,
    );

    if (socket.connected) {
      setConnected(true);
    }

    const onConnect = () => {
      console.log("✅ ChatPage: connect event received");
      setConnected(true);
    };

    const onDisconnect = () => {
      setConnected(false);
      console.log("❌ ChatPage: Socket disconnected");
    };

    const handleNewMessage = (message) => {
      console.log("✅ ChatPage: Received new_message:", message);
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        // Replace optimistic message with server-confirmed one
        const idx = prev.findIndex((m) => m._optimistic && m.message === message.message);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = message;
          return updated;
        }
        return [...prev, message];
      });
      const userId = localStorage.getItem("userId");
      if (userId) {
        markAsRead(id, userId)
          .then(() => console.log("✅ Messages marked as read"))
          .catch((err) => console.warn("⚠️ Failed to mark as read:", err));
      }
    };

    const handleRoomJoined = ({ appointmentId }) => {
      console.log("✅ ChatPage: room_joined event received for:", appointmentId);
      setConnected(true);
    };

    const handleUserTyping = ({ userId, role, isTyping: typing, senderRole }) => {
      console.log("ChatPage: User typing:", userId, role, typing);
      if (userId !== currentUser?._id) {
        setIsTyping(typing);
        setTypingUserRole(senderRole || role);
      }
    };

    const handleError = (error) => {
      console.error("ChatPage: Socket error:", error);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_message", handleNewMessage);
    socket.on("room_joined", handleRoomJoined);
    socket.on("user_typing", handleUserTyping);
    socket.on("error", handleError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_message", handleNewMessage);
      socket.off("room_joined", handleRoomJoined);
      socket.off("user_typing", handleUserTyping);
      socket.off("error", handleError);
    };
  }, [id, currentUser]);

  // Join room and fetch initial messages
  useEffect(() => {
    if (!id) return;

    getMessages(id)
      .then((res) => {
        setMessages(res.data.messages || res.data.data || []);
        if (currentUser) {
          markAsRead(id, currentUser._id).catch(() => {});
        }
      })
      .catch((err) => console.error("Failed to fetch messages:", err));

    joinChatRoom(id);

    return () => {
      leaveChatRoom(id);
    };
  }, [id, currentUser]);

  const handleSend = (text) => {
    if (!connected || !text.trim()) {
      console.warn(
        "Cannot send: connected=",
        connected,
        "text=",
        !!text.trim(),
      );
      return;
    }
    const role = localStorage.getItem("role") || currentUser?.role || "patient";
    const userId = localStorage.getItem("userId");

    // Optimistic: show message immediately
    const optimisticMsg = {
      _id: `temp-${Date.now()}`,
      senderId: userId,
      senderRole: role,
      message: text.trim(),
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    sendChatMessage(id, text.trim());
    emitStopTyping(id);
    clearTimeout(typingTimeoutRef.current);
  };

  const handleTyping = useCallback(() => {
    if (!id) return;
    emitTyping(id);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(id);
    }, 1500);
  }, [id]);

  const otherPerson = appointment
    ? currentUser?.role === "patient"
      ? appointment.doctor
      : appointment.patient
    : null;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link
            to={`/appointments/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[#0d9488] dark:hover:text-teal-400 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Appointment
          </Link>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            connected
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Chat container */}
      <div
        className="glass-card rounded-2xl overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 200px)" }}
      >
        {/* Chat header */}
        <div className="bg-gradient-to-r from-[#0d9488] to-[#0891b2] px-5 py-3.5 flex items-center gap-3 shrink-0">
          {otherPerson ? (
            <>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                {getInitials(displayName(otherPerson))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {currentUser?.role === "patient"
                    ? `Dr. ${displayName(otherPerson)}`
                    : displayName(otherPerson)}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white/60">Online</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-white">Consultation Chat</p>
            </div>
          )}
        </div>

        {/* Info bar */}
        <div className="px-4 py-1.5 bg-white dark:bg-[var(--glass-bg)] border-b border-gray-100 dark:border-white/5">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            Messages are real-time via Socket.io
          </span>
        </div>

        {/* Messages */}
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          typingUserRole={typingUserRole}
          currentUserRole={currentUserRole}
          doctorName={doctorName}
        />

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          disabled={!connected}
        />
      </div>
    </div>
  );
}
