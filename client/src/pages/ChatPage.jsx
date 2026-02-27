import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getMessages, markAsRead } from "../api/chatApi";
import useSocket from "../hooks/useSocket";
import ChatWindow from "../components/chat/ChatWindow";
import ChatInput from "../components/chat/ChatInput";

export default function ChatPage() {
  const { id } = useParams();
  const { currentUser } = useUser();
  const [messages, setMessages] = useState([]);
  const socket = useSocket();

  // Join room and fetch initial messages
  useEffect(() => {
    socket.emit("joinRoom", id);

    getMessages(id)
      .then((res) => {
        setMessages(res.data.data);
        if (currentUser) {
          markAsRead(id, currentUser._id).catch(() => {});
        }
      })
      .catch((err) => console.error("Failed to fetch messages:", err));
  }, [id, currentUser, socket]);

  // Listen for new messages from socket
  useEffect(() => {
    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      if (currentUser) {
        markAsRead(id, currentUser._id).catch(() => {});
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [id, currentUser, socket]);

  const handleSend = (text) => {
    if (!currentUser) return;
    socket.emit("sendMessage", {
      appointment: id,
      sender: currentUser._id,
      message: text,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Consultation Chat</h1>
        <Link to={`/appointments/${id}`} className="text-sm text-gray-500 hover:text-blue-600 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Appointment</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
        <ChatWindow messages={messages} currentUserId={currentUser?._id} />
        <ChatInput onSend={handleSend} disabled={!currentUser} />
      </div>
    </div>
  );
}
