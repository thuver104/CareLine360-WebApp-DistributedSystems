import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";

export default function ChatWindow({ messages, isTyping, typingUserRole }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ minHeight: "400px" }}>
      {messages.length === 0 && (
        <p className="text-center text-gray-400 mt-8">No messages yet. Start the conversation!</p>
      )}
      {messages.map((msg) => (
        <ChatBubble
          key={msg._id || msg.createdAt}
          message={msg}
          senderRole={msg.senderRole}
        />
      ))}

      {/* Typing indicator - shows who is typing */}
      {isTyping && (
        <div className="flex justify-start mb-3">
          <div className={`px-4 py-2.5 rounded-2xl rounded-bl-sm ${
            typingUserRole === 'doctor' 
              ? "bg-green-600 text-white" 
              : "bg-blue-600 text-white"
          }`}>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs ml-2">
              {typingUserRole === 'doctor' ? 'Doctor is typing...' : 'Patient is typing...'}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
