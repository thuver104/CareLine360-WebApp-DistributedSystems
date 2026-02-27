import { displayName } from "../../utils/displayName";

export default function ChatBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
        isOwn
          ? "bg-blue-600 text-white rounded-br-sm"
          : "bg-white text-gray-800 shadow-sm ring-1 ring-gray-100 rounded-bl-sm"
      }`}>
        <p className={`text-xs font-medium mb-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
          {displayName(message.sender)}
        </p>
        <p className="text-sm">{message.message}</p>
        <p className={`text-xs mt-1 ${isOwn ? "text-blue-200" : "text-gray-400"}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
