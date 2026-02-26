import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { getSocket } from "../../socket/socketClient";
import { getChatHistory } from "../../api/doctorApi";

/**
 * ChatWidget — Real-time chat using Socket.io
 *
 * Props:
 *   appointment  - full appointment object
 *   onClose      - callback to close widget
 */
export default function ChatWidget({ appointment, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // other party typing
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  const myUserId = localStorage.getItem("userId");
  const appointmentId = appointment?._id;
  const patientName = appointment?.patientProfile?.fullName || "Patient";

  // ── Load history + join Socket.io room ────────────────────────────────────
  useEffect(() => {
    if (!appointmentId) return;

    const socket = getSocket();

    // Load history via REST first
    getChatHistory(appointmentId)
      .then((r) => {
        setMessages(r.data.messages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Join the room
    socket.emit("join_room", { appointmentId });

    // ── Socket event listeners ───────────────────────────────────────────────

    const onRoomJoined = ({ messages: serverMessages }) => {
      // Use REST history already loaded; room_joined confirms access
      setConnected(true);
      if (serverMessages?.length) setMessages(serverMessages);
    };

    const onReceiveMessage = (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const onUserTyping = ({ userId, isTyping: typing }) => {
      if (userId !== myUserId) setIsTyping(typing);
    };

    const onMessagesRead = () => {
      setMessages((prev) =>
        prev.map((m) => (m.senderId === myUserId ? { ...m, isRead: true } : m)),
      );
    };

    const onError = ({ message }) => {
      setError(message);
    };

    socket.on("room_joined", onRoomJoined);
    socket.on("receive_message", onReceiveMessage);
    socket.on("user_typing", onUserTyping);
    socket.on("messages_read", onMessagesRead);
    socket.on("error", onError);

    return () => {
      socket.emit("leave_room", { appointmentId });
      socket.off("room_joined", onRoomJoined);
      socket.off("receive_message", onReceiveMessage);
      socket.off("user_typing", onUserTyping);
      socket.off("messages_read", onMessagesRead);
      socket.off("error", onError);
    };
  }, [appointmentId, myUserId]);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!text.trim() || sending) return;

    const socket = getSocket();
    setSending(true);

    // Stop typing indicator
    socket.emit("typing", { appointmentId, isTyping: false });
    clearTimeout(typingTimeout.current);

    socket.emit("send_message", { appointmentId, message: text.trim() });
    setText("");
    setSending(false);
  }, [text, sending, appointmentId]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Typing indicator ───────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    setText(e.target.value);

    const socket = getSocket();
    socket.emit("typing", { appointmentId, isTyping: true });

    // Stop typing after 1.5s of no input
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { appointmentId, isTyping: false });
    }, 1500);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-80 md:w-96 flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        style={{ height: "560px" }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="bg-teal-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-teal-400 flex items-center justify-center text-white text-sm font-bold">
                {patientName[0]}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-teal-600 ${connected ? "bg-green-400" : "bg-gray-400"}`}
              />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">
                {patientName}
              </p>
              <p className="text-teal-200 text-xs">
                {connected ? "Online" : "Connecting…"} ·{" "}
                {new Date(appointment.date).toLocaleDateString("en-GB")}{" "}
                {appointment.time}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── Error Banner ───────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-xs px-3 py-1.5 flex justify-between">
            {error}
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* ── Messages ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <span className="text-3xl">💬</span>
              <p className="text-sm">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe =
                msg.senderId === myUserId ||
                msg.senderId?.toString() === myUserId;
              return (
                <div
                  key={msg._id || msg.createdAt}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[78%] group relative`}>
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? "bg-teal-600 text-white rounded-br-sm"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                      }`}
                    >
                      {msg.message}
                    </div>
                    <div
                      className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <span className="text-[10px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMe && (
                        <span
                          className={`text-[10px] ${msg.isRead ? "text-teal-500" : "text-gray-400"}`}
                        >
                          {msg.isRead ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ──────────────────────────────────────────────── */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-3 py-3 flex gap-2 flex-shrink-0">
          <textarea
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKey}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            style={{ maxHeight: "80px", overflowY: "auto" }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || !connected}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors flex-shrink-0 self-end"
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
