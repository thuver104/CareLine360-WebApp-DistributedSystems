import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMessages } from "../api/chatApi";
import { getAppointmentById } from "../api/appointmentApi";
import useSocket from "../hooks/useSocket";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");
  const [messages, setMessages] = useState([]);
  const [otherName, setOtherName] = useState("");
  const socket = useSocket();

  // Fetch appointment to get the other party's name
  useEffect(() => {
    getAppointmentById(id)
      .then((res) => {
        const apt = res.data.data || res.data.appointment || res.data;
        if (role === "patient") {
          const doc = apt.doctor;
          setOtherName(
            doc?.fullName || doc?.name || doc?.email || "Doctor"
          );
        } else {
          const pat = apt.patient || apt.patientProfile;
          setOtherName(
            pat?.fullName || pat?.name || pat?.email || "Patient"
          );
        }
      })
      .catch(() => {});
  }, [id, role]);

  // Join room and fetch initial messages
  useEffect(() => {
    if (!socket) return;
    socket.emit("joinRoom", id);

    getMessages(id)
      .then((res) => {
        setMessages(res.data.messages || []);
      })
      .catch((err) => console.error("Failed to fetch messages:", err));
  }, [id, socket]);

  // Listen for new messages from socket
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [id, socket]);

  const handleSend = (text) => {
    if (!userId) return;
    socket.emit("sendMessage", {
      appointment: id,
      sender: userId,
      senderRole: role,
      message: text,
    });
  };

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-100px)] flex flex-col bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={() => navigate(`/appointments/${id}`)}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-semibold text-gray-800">
              {role === "patient" && otherName && !otherName.startsWith("Dr") ? `Dr. ${otherName}` : otherName || "Chat"}
            </span>
          </div>
        </div>

        <div className="w-7" />
      </div>

      {/* Messages */}
      <ChatWindow messages={messages} currentUserId={userId} />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={!userId} />
    </div>
  );
}
