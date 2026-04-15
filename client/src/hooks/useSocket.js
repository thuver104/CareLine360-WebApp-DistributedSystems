import { useEffect, useRef } from "react";
import { connectSocket, getSocket } from "../socket/socketClient";

export default function useSocket() {
  const socketRef = useRef(null);

  if (!socketRef.current) {
    // Use the shared authenticated socket from socketClient
    socketRef.current = getSocket() || connectSocket();
  }

  useEffect(() => {
    // Ensure connection exists
    if (!socketRef.current?.connected) {
      socketRef.current = connectSocket();
    }
  }, []);

  return socketRef.current;
}
