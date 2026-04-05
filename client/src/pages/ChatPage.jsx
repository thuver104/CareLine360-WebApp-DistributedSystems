import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { getMessages, markAsRead } from "../api/chatApi";
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
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserRole, setTypingUserRole] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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

    // Check if already connected
    if (socket.connected) {
      console.log("✅ ChatPage: Socket already connected");
      setConnected(true);
    } else {
      console.log(
        "⚠️ ChatPage: Socket not yet connected, waiting for connect event",
      );
    }

    // Connection status
    const onConnect = () => {
      console.log("✅ ChatPage: connect event received");
      setConnected(true);
    };

    const onDisconnect = () => {
      setConnected(false);
      console.log("❌ ChatPage: Socket disconnected");
    };

    // New message received
    const handleNewMessage = (message) => {
      console.log("✅ ChatPage: Received new_message:", message);
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
      if (currentUser) {
        markAsRead(id, currentUser._id)
          .then(() => console.log("✅ Messages marked as read"))
          .catch((err) => console.warn("⚠️ Failed to mark as read:", err));
      }
    };

    // Room joined confirmation
    const handleRoomJoined = ({ appointmentId }) => {
      console.log(
        "✅ ChatPage: room_joined event received for:",
        appointmentId,
      );
      setConnected(true);
    };

    // User typing indicator
    const handleUserTyping = ({
      userId,
      role,
      isTyping: typing,
      senderRole,
    }) => {
      console.log("ChatPage: User typing:", userId, role, typing);
      // Don't show typing indicator for self
      if (userId !== currentUser?._id) {
        setIsTyping(typing);
        setTypingUserRole(senderRole || role);
      }
    };

    // Error handler
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

    // Ensure socket is initialized
    let socket = socketRef.current;
    if (!socket) {
      const s = getSocket();
      if (s) {
        socketRef.current = s;
        socket = s;
      } else {
        console.error("Socket failed to initialize");
        return;
      }
    }

    // Fetch messages
    getMessages(id)
      .then((res) => {
        setMessages(res.data.messages || res.data.data || []);
        if (currentUser) {
          markAsRead(id, currentUser._id).catch(() => {});
        }
      })
      .catch((err) => console.error("Failed to fetch messages:", err));

    // Join room (waits for connection if needed)
    joinChatRoom(id);

    return () => {
      leaveChatRoom(id);
    };
  }, [id, currentUser]);

  const handleSend = (text) => {
    if (!currentUser || !connected || !text.trim()) {
      console.warn(
        "Cannot send: currentUser=",
        !!currentUser,
        "connected=",
        connected,
        "text=",
        !!text.trim(),
      );
      return;
    }
    sendChatMessage(id, text.trim());
    // Stop typing indicator
    emitStopTyping(id);
    clearTimeout(typingTimeoutRef.current);
  };

  const handleTyping = useCallback(() => {
    if (!id) return;
    emitTyping(id);

    // Stop typing after 1.5s of no input
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(id);
    }, 1500);
  }, [id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Consultation Chat
          </h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <Link
          to={`/appointments/${id}`}
          className="text-sm text-gray-500 hover:text-blue-600 flex items-center space-x-1"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Back to Appointment</span>
        </Link>
      </div>

      <div
        className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden flex flex-col"
        style={{ height: "calc(100vh - 220px)" }}
      >
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          typingUserRole={typingUserRole}
        />
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          disabled={!currentUser}
          isTyping={isTyping}
          typingUserRole={typingUserRole}
        />
      </div>
    </div>
  );
}
