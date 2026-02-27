import { useEffect, useRef } from "react";
import ChatBubble from "./ChatBubble";

export default function ChatWindow({ messages, currentUserId }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ minHeight: "400px" }}>
      {messages.length === 0 && (
        <p className="text-center text-gray-400 mt-8">No messages yet. Start the conversation!</p>
      )}
      {messages.map((msg) => (
        <ChatBubble
          key={msg._id}
          message={msg}
          isOwn={msg.sender?._id === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
