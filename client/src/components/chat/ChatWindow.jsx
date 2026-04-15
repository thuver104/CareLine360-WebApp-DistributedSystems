import { useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import ChatBubble from "./ChatBubble";

export default function ChatWindow({
  messages,
  isTyping,
  typingUserRole,
  currentUserRole,
  doctorName,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div
      className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50 dark:bg-white/[0.02]"
      style={{ minHeight: 0 }}
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-10">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-3">
            <MessageSquare className="w-5 h-5 text-[#0d9488]" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No messages yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Start the conversation!</p>
        </div>
      )}

      {messages.map((msg, i) => (
        <ChatBubble
          key={msg._id || `msg-${i}`}
          message={msg}
          senderRole={msg.senderRole}
          currentUserRole={currentUserRole}
          doctorName={doctorName}
        />
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start mb-3">
          <div
            className={`px-4 py-2.5 rounded-2xl rounded-bl-md ${
              typingUserRole === "doctor"
                ? "bg-gradient-to-br from-[#0d9488] to-[#0891b2] text-white"
                : "bg-white dark:bg-white/10 text-gray-800 dark:text-gray-200 shadow-sm ring-1 ring-gray-100 dark:ring-white/10"
            }`}
          >
            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-current opacity-60 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
              <span className="text-xs ml-1 opacity-70">
                {typingUserRole === "doctor"
                  ? `${doctorName || "Doctor"} is typing...`
                  : "Patient is typing..."}
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
